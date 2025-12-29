SELECT 
      T.[Movimentacoes_ID]
    , T.[CREDOR]
    , T.[CREDOR_ID]
    , T.[CAMPANHA]
    , T.[CAMPANHA_ID]
    , T.[CPF_CNPJ_CLIENTE]
    , T.[CLIENTE]
    , T.[NEGOCIADOR]
    , T.[CaOperadorProprietarioID]
    , T.[VENCIMENTO]
    , T.[REFERENCIA]

    , VencAnt.VENCIMENTO_MAIS_ANTIGO

    , T.[N_TITULO]
    , T.[PARCELA]
    , T.[VALOR]

    , CASE
          ----------------------------------------------------------------
          -- 0) Não tem data mais antiga E parcela = 1 -> Novo
          ----------------------------------------------------------------
          WHEN VencAnt.VENCIMENTO_MAIS_ANTIGO IS NULL
               AND T.[PARCELA] = 1
          THEN 'Novo'

          ----------------------------------------------------------------
          -- 0.1) Não tem data mais antiga E parcela <> 1 
          --      -> usa lógica baseada no vencimento vs mês atual
          ----------------------------------------------------------------
          WHEN VencAnt.VENCIMENTO_MAIS_ANTIGO IS NULL
               AND T.[PARCELA] <> 1
               AND (
                        YEAR(T.[VENCIMENTO]) > YEAR(GETDATE())
                    OR (
                            YEAR(T.[VENCIMENTO]) = YEAR(GETDATE())
                        AND MONTH(T.[VENCIMENTO]) > MONTH(GETDATE())
                       )
                   )
          THEN 'Previsão'

          WHEN VencAnt.VENCIMENTO_MAIS_ANTIGO IS NULL
               AND T.[PARCELA] <> 1
               AND YEAR(T.[VENCIMENTO]) = YEAR(GETDATE())
               AND MONTH(T.[VENCIMENTO]) = MONTH(GETDATE())
          THEN 'Corrente'

          WHEN VencAnt.VENCIMENTO_MAIS_ANTIGO IS NULL
               AND T.[PARCELA] <> 1
               AND (
                        YEAR(T.[VENCIMENTO]) < YEAR(GETDATE())
                    OR (
                            YEAR(T.[VENCIMENTO]) = YEAR(GETDATE())
                        AND MONTH(T.[VENCIMENTO]) < MONTH(GETDATE())
                       )
                   )
          THEN 'Inadimplido'

          ----------------------------------------------------------------
          -- 1) Mais antigo < vencimento E mais antigo em mês/ano anterior
          --    ao mês/ano atual -> sempre Inadimplido
          ----------------------------------------------------------------
          WHEN VencAnt.VENCIMENTO_MAIS_ANTIGO < T.[VENCIMENTO]
               AND (
                        YEAR(VencAnt.VENCIMENTO_MAIS_ANTIGO) < YEAR(GETDATE())
                    OR (
                            YEAR(VencAnt.VENCIMENTO_MAIS_ANTIGO) = YEAR(GETDATE())
                        AND MONTH(VencAnt.VENCIMENTO_MAIS_ANTIGO) < MONTH(GETDATE())
                       )
                   )
          THEN 'Inadimplido'

          ----------------------------------------------------------------
          -- 2) Vencimento em mês/ano futuro em relação ao atual -> Previsão
          ----------------------------------------------------------------
          WHEN YEAR(T.[VENCIMENTO]) > YEAR(GETDATE())
               OR (
                        YEAR(T.[VENCIMENTO]) = YEAR(GETDATE())
                    AND MONTH(T.[VENCIMENTO]) > MONTH(GETDATE())
                  )
          THEN 'Previsão'

          ----------------------------------------------------------------
          -- 3) Mais antigo em mês/ano futuro em relação ao atual -> Previsão
          ----------------------------------------------------------------
          WHEN YEAR(VencAnt.VENCIMENTO_MAIS_ANTIGO) > YEAR(GETDATE())
               OR (
                        YEAR(VencAnt.VENCIMENTO_MAIS_ANTIGO) = YEAR(GETDATE())
                    AND MONTH(VencAnt.VENCIMENTO_MAIS_ANTIGO) > MONTH(GETDATE())
                  )
          THEN 'Previsão'

          ----------------------------------------------------------------
          -- 4) Mês/ano do mais antigo é o mês/ano atual -> Corrente
          ----------------------------------------------------------------
          WHEN YEAR(VencAnt.VENCIMENTO_MAIS_ANTIGO) = YEAR(GETDATE())
               AND MONTH(VencAnt.VENCIMENTO_MAIS_ANTIGO) = MONTH(GETDATE())
          THEN 'Corrente'

          ----------------------------------------------------------------
          -- 5) Vencimento em mês/ano anterior ao atual -> Inadimplido
          ----------------------------------------------------------------
          WHEN YEAR(T.[VENCIMENTO]) < YEAR(GETDATE())
               OR (
                        YEAR(T.[VENCIMENTO]) = YEAR(GETDATE())
                    AND MONTH(T.[VENCIMENTO]) < MONTH(GETDATE())
                  )
          THEN 'Inadimplido'

          ----------------------------------------------------------------
          -- 6) Qualquer outra combinação não prevista explicitamente
          ----------------------------------------------------------------
          ELSE 'VERIFICAR'
      END AS [STATUS]

    , T.[Data_Carga]

FROM [Candiotto_reports].[dbo].[tabela_base_painel] AS T

    -- Traz o MoInadimplentesID a partir do Movimentacoes_ID da base do painel
    LEFT JOIN [Candiotto_STD].[dbo].Movimentacoes M 
        ON M.Movimentacoes_ID = T.Movimentacoes_ID

    -- Consulta equivalente à "primeira consulta": menor vencimento por inadimplente
    OUTER APPLY (
        SELECT MIN(M2.MoDataVencimento) AS VENCIMENTO_MAIS_ANTIGO
        FROM [Candiotto_STD].[dbo].Movimentacoes M2
        WHERE M2.MoInadimplentesID = M.MoInadimplentesID
          AND ISNULL(M2.MoValorRecebido,0) = 0
          AND M2.MoOrigemMovimentacao = 'A'
          AND M2.MoStatusMovimentacao = '0'
          AND M2.MoDataVencimento > CAST('2024-01-01' AS DATE)
    ) AS VencAnt
where cast(T.[Data_Carga] as date) = '{referencia}'