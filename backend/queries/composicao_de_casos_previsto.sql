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
    INNER JOIN cte_acordo_nao_pago np 
        ON CAST(pg.Acordo AS VARCHAR(50)) = CAST(np.Acordo AS VARCHAR(50))
)
SELECT DISTINCT
    M.Movimentacoes_ID,
    dbo.RetornaNomeRazaoSocial(M.MoClientesID) AS 'CREDOR',
    M.MoClientesID AS 'CREDOR ID',
    dbo.RetornaNomeCampanha(M.MoCampanhasID, 1) AS 'CAMPANHA', 
    M.MoCampanhasID AS 'CAMPANHA ID', 
    dbo.RetornaCPFCNPJ(M.MoInadimplentesID, 1) AS 'CPF/CNPJ CLIENTE',
    dbo.RetornaNomeRazaoSocial(M.MoInadimplentesID) AS 'CLIENTE',
    dbo.RetornaNomeUsuario(CaOperadorProprietarioID) AS 'NEGOCIADOR',
    CaOperadorProprietarioID,
    M.MoDataVencimento AS 'VENCIMENTO', 
    CAST(DATEADD(MONTH, DATEDIFF(MONTH,0,MoDataVencimento),0) AS DATE) AS REFERENCIA,

    VencAnt.VENCIMENTO_MAIS_ANTIGO,

    MoNumeroDocumento AS 'N TITULO',
    M.MOParcela AS 'PARCELA',
    M.MoValorDocumento AS 'VALOR',

    CASE
        --------------------------------------------------------------------
        -- 0) Não tem data mais antiga (não aparece na primeira consulta)
        --------------------------------------------------------------------
        WHEN VencAnt.VENCIMENTO_MAIS_ANTIGO IS NULL
        THEN 'Novo'

        --------------------------------------------------------------------
        -- 1) Mais antigo < vencimento E mais antigo em mês/ano anterior ao atual -> Inadimplido
        --------------------------------------------------------------------
        WHEN VencAnt.VENCIMENTO_MAIS_ANTIGO < M.MoDataVencimento
             AND (
                    YEAR(VencAnt.VENCIMENTO_MAIS_ANTIGO) < YEAR(GETDATE())
                 OR (
                        YEAR(VencAnt.VENCIMENTO_MAIS_ANTIGO) = YEAR(GETDATE())
                    AND MONTH(VencAnt.VENCIMENTO_MAIS_ANTIGO) < MONTH(GETDATE())
                    )
                 )
        THEN 'Inadimplido'

        --------------------------------------------------------------------
        -- 2) Vencimento da movimentação em mês/ano futuro -> Previsão
        --------------------------------------------------------------------
        WHEN YEAR(M.MoDataVencimento) > YEAR(GETDATE())
             OR (
                    YEAR(M.MoDataVencimento) = YEAR(GETDATE())
                AND MONTH(M.MoDataVencimento) > MONTH(GETDATE())
                )
        THEN 'Previsão'

        --------------------------------------------------------------------
        -- 3) Mais antigo em mês/ano futuro -> Previsão
        --------------------------------------------------------------------
        WHEN YEAR(VencAnt.VENCIMENTO_MAIS_ANTIGO) > YEAR(GETDATE())
             OR (
                    YEAR(VencAnt.VENCIMENTO_MAIS_ANTIGO) = YEAR(GETDATE())
                AND MONTH(VencAnt.VENCIMENTO_MAIS_ANTIGO) > MONTH(GETDATE())
                )
        THEN 'Previsão'

        --------------------------------------------------------------------
        -- 4) Mês/ano do mais antigo é o mês/ano atual -> Corrente
        --    (ex: hoje 2025-12-24, mais_antigo 2025-12-20, venc 2026-02-20)
        --------------------------------------------------------------------
        WHEN YEAR(VencAnt.VENCIMENTO_MAIS_ANTIGO) = YEAR(GETDATE())
             AND MONTH(VencAnt.VENCIMENTO_MAIS_ANTIGO) = MONTH(GETDATE())
        THEN 'Corrente'

        --------------------------------------------------------------------
        -- 5) Vencimento em mês/ano anterior ao atual -> Inadimplido
        --------------------------------------------------------------------
        WHEN YEAR(M.MoDataVencimento) < YEAR(GETDATE())
             OR (
                    YEAR(M.MoDataVencimento) = YEAR(GETDATE())
                AND MONTH(M.MoDataVencimento) < MONTH(GETDATE())
                )
        THEN 'Inadimplido'

        --------------------------------------------------------------------
        -- 6) Qualquer outra combinação não prevista explicitamente
        --------------------------------------------------------------------
        ELSE 'VERIFICAR'
    END AS 'STATUS',

    CA.Aging,
    CASE 
        WHEN CA.Aging <= 90 THEN '1. Ate 90 dias'
        WHEN CA.Aging BETWEEN 91 AND 180 THEN '2. 91 a 180 dias'
        WHEN CA.Aging BETWEEN 181 AND 360 THEN '3. 181 a 360 dias'
        WHEN CA.Aging BETWEEN 361 AND 720 THEN '4. 361 a 720 dias'
        ELSE '5. Acima de 720 dias'
    END AS 'FAIXA_AGING'
FROM Movimentacoes M
    LEFT JOIN MovimentacoesAcordos A ON MovimentacoesAcordos_ID = MoDestinoAcordoID
    INNER JOIN Pessoas WITH(NOLOCK) ON Pessoas_ID = M.MoInadimplentesID
    INNER JOIN CampanhasPessoas WITH(NOLOCK) 
        ON CaPessoasID = Pessoas_ID AND CaCampanhasID = M.MoCampanhasID

    -- Data de vencimento mais antiga por Inadimplente (equivalente à 1ª consulta)
    CROSS APPLY (
        SELECT MIN(M2.MoDataVencimento) AS VENCIMENTO_MAIS_ANTIGO
        FROM Movimentacoes M2
        WHERE M2.MoInadimplentesID = M.MoInadimplentesID 
          AND ISNULL(M2.MoValorRecebido,0) = 0 
          AND M2.MoOrigemMovimentacao = 'A' 
          AND M2.MoStatusMovimentacao = '0'
          AND M2.MoDataVencimento > CAST('2024-01-01' AS DATE)
    ) AS VencAnt

    LEFT JOIN tabela_temporaria CA ON CA.Acordo = 
        LTRIM(RTRIM(
            CASE
                WHEN CHARINDEX('AC- ', MoNumeroDocumento) > 0 
                THEN SUBSTRING(MoNumeroDocumento, CHARINDEX('AC- ', MoNumeroDocumento) + LEN('AC- '), LEN(MoNumeroDocumento))
                ELSE MoNumeroDocumento
            END
        ))
WHERE 
    ISNULL(MoValorRecebido,0) = 0 
    AND MoOrigemMovimentacao = 'A' 
    AND MoStatusMovimentacao = '0'
    AND MoDataVencimento > CAST('2024-01-01' AS DATE);