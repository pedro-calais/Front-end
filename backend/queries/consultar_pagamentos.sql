-- Primeiro, criamos as CTEs e inserimos o resultado na tabela temporária
WITH vencimentos AS (
    SELECT 
        MovimentacoesAcordos_ID AS Acordo,
        MoDataVencimento,
        MoDataAcordo
    FROM Movimentacoes M
    INNER JOIN MovimentacoesAcordos A ON MovimentacoesAcordos_ID = MoDestinoAcordoID
    INNER JOIN Pessoas WITH(NOLOCK) ON Pessoas_ID = M.MoInadimplentesID
),
cte_acordo_nao_pago AS (
    SELECT 
        Acordo,
        MIN(MoDataVencimento) AS Menor_Vencimento,
        DATEDIFF(DAY, MIN(MoDataVencimento), MoDataAcordo) AS Aging
    FROM vencimentos
    GROUP BY Acordo, MoDataAcordo
),
cte_acordo_pago AS(
    SELECT
        Acordo,
        DATEDIFF(DAY, MIN(V.MoDataVencimento), MIN(M.MoDataRecebimento)) AS Aging
    FROM Movimentacoes M
        INNER JOIN MovimentacoesAcordos A ON A.MovimentacoesAcordos_ID = M.MoMovimentacoesAcordosID
        INNER JOIN vencimentos V on M.MoMovimentacoesAcordosID = V.Acordo
    WHERE
        MoOrigemMovimentacao = 'A'
    GROUP BY
        Acordo
),
tabela_temporaria AS (
    SELECT DISTINCT
        CAST(pg.Acordo AS VARCHAR(50)) AS Acordo,
        CASE
            WHEN pg.Aging IS NOT NULL THEN pg.Aging
            ELSE np.Aging
        END AS Aging
    FROM cte_acordo_pago pg
    INNER JOIN cte_acordo_nao_pago np ON CAST(pg.Acordo AS VARCHAR(50)) = CAST(np.Acordo AS VARCHAR(50))
)
SELECT  distinct 
    M.Movimentacoes_ID,
    dbo.RetornaNomeRazaoSocial(M.MoClientesID) AS 'CREDOR',
    M.MoClientesID AS 'CREDOR ID',
    dbo.RetornaNomeCampanha(M.MoCampanhasID, 1) AS 'CAMPANHA', 
    M.MoCampanhasID AS 'CAMPANHA ID', 
    dbo.RetornaCPFCNPJ(M.MoInadimplentesID, 1) AS 'CPF/CNPJ Cliente',
    dbo.RetornaNomeRazaoSocial(M.MoInadimplentesID) AS 'CLIENTE',
    CAST(MoDataAcordo AS DATE) AS 'DATA_ACORDO',
    MoDataVencimento AS 'VENCIMENTO', 
    MoNumeroDocumento AS 'N TITULO',
    MOParcela AS 'PARCELA',
    MoValorDocumento AS 'VALOR_ORIGINAL', 
    CAST(MoDataRecebimento AS DATE) AS 'DATA_PAGAMENTO', 
    MoValorRecebido AS 'VALOR_PAGO',
    dbo.RetornaNomeUsuario(MoUsuarioRecebeuID) AS 'NEGOCIADOR_RECEBIMENTO',
    MoUsuarioRecebeuID AS 'idNegociador',
    CASE
        WHEN MoParcela = 1 THEN 'Novo'
        WHEN (YEAR(MoDataVencimento) < YEAR(MoDataRecebimento) OR (YEAR(MoDataVencimento) = YEAR(MoDataRecebimento) AND MONTH(MoDataVencimento) < MONTH(MoDataRecebimento))) THEN 'Inadimplido'
        WHEN ((YEAR(MoDataVencimento) = YEAR(MoDataRecebimento) AND MONTH(MoDataVencimento) = MONTH(MoDataRecebimento))) THEN 'Corrente'
        WHEN (YEAR(MoDataVencimento) > YEAR(MoDataRecebimento) OR (YEAR(MoDataVencimento) = YEAR(MoDataRecebimento) AND MONTH(MoDataVencimento) > MONTH(MoDataRecebimento))) THEN 'Novo'
        ELSE 'VERIFICAR'
    END AS 'STATUS',
	CA.Aging,
    CASE 
        WHEN CA.Aging <= 90 THEN '1. Ate 90 dias'
        WHEN CA.Aging BETWEEN 91 AND 180 THEN '2. 91 a 180 dias'
        WHEN CA.Aging BETWEEN 181 AND 360 THEN '3. 181 a 360 dias'
        WHEN CA.Aging BETWEEN 361 AND 720 THEN '4. 361 a 720 dias'
        ELSE '5. Acima de 720 dias'
    END AS 'FAIXA_AGING',
    CAST(DATEADD(MONTH, DATEDIFF(MONTH, 0, MoDataRecebimento), 0) AS DATE) AS 'REFERENCIA'
    FROM Movimentacoes M
        LEFT JOIN MovimentacoesAcordos A on MovimentacoesAcordos_ID = MoMovimentacoesAcordosID
        INNER JOIN Pessoas With(NOLOCK) ON Pessoas_ID = M.MoInadimplentesID
		LEFT JOIN tabela_temporaria CA ON CA.Acordo = 
    LTRIM(RTRIM(
        CASE
            WHEN CHARINDEX('AC- ', MoNumeroDocumento) > 0 
            THEN SUBSTRING(MoNumeroDocumento, CHARINDEX('AC- ', MoNumeroDocumento) + LEN('AC- '), LEN(MoNumeroDocumento))
            ELSE MoNumeroDocumento
        END
    ))
    WHERE MoStatusMovimentacao in (2,3,4,5,6,7) 
    AND MoDataRecebimento > CAST('2023-02-01' as date) 
    AND  dbo.RetornaNomeUsuario(MoUsuarioRecebeuID) <> 'Pedro Ryan'
