SELECT top 100
    campanhaID,
    CREDOR,
    CAMPANHA,
    CPF_CNPJ_CLIENTE,
    Nome,
    NEGOCIADOR,
    CoUsuariosID,
    RO,
    DATA
FROM [Candiotto_DBA].[dbo].[tabelaacionamento]
WHERE 1=1