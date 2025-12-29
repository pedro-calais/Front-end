from datetime import datetime, date, time, timezone
from dateutil import parser
import pandas as pd


def ler_consulta_sql(caminho_arquivo):
    """
    Lê um arquivo .sql e retorna seu conteúdo como string.
    
    Args:
        caminho_arquivo (str): Caminho para o arquivo .sql
        
    Returns:
        str: Conteúdo do arquivo SQL como string
    """
    try:
        with open(caminho_arquivo, 'r', encoding='utf-8') as arquivo:
            consulta = arquivo.read()
        return consulta
    except FileNotFoundError:
        raise FileNotFoundError(f"Arquivo não encontrado: {caminho_arquivo}")
    except Exception as e:
        raise Exception(f"Erro ao ler arquivo SQL: {str(e)}")





def filtro_data(df, coluna, data_inicio, data_fim):
    """
    Filtra um DataFrame entre 'data_inicio' e 'data_fim' em uma determinada 'coluna'.

    Args:
        df (pd.DataFrame): DataFrame contendo os dados a serem filtrados.
        coluna (str): Nome da coluna do DataFrame que representa a data.
        data_inicio (various): Data inicial em diversos formatos (str, datetime, date, etc.).
        data_fim (various): Data final em diversos formatos (str, datetime, date, etc.).

    Returns:
        pd.DataFrame: DataFrame filtrado apenas com as linhas em que
                      'coluna' está entre 'data_inicio' e 'data_fim'.

    Observações:
        - Esta função converte a coluna de datas para datetime; se a coluna já estiver
          em formato datetime, a conversão será idempotente (não prejudica).
        - Se 'data_inicio' ou 'data_fim' não puderem ser convertidos, uma ValueError será gerada.
        - Caso haja valores NaN após a conversão (ex.: valores inválidos), eles não passam no filtro
          pois não satisfazem a condição de ser >= data_inicio e <= data_fim.
    """
    df_copy = df.copy()

    df_copy[coluna] = pd.to_datetime(df_copy[coluna], errors='coerce')

    start_date = pd.to_datetime(data_inicio, errors='coerce')
    end_date = pd.to_datetime(data_fim, errors='coerce')

    if pd.isna(start_date):
        raise ValueError(f"Não foi possível converter '{data_inicio}' em uma data válida.")
    if pd.isna(end_date):
        raise ValueError(f"Não foi possível converter '{data_fim}' em uma data válida.")

    df_filtrado = df_copy[(df_copy[coluna] >= start_date) & (df_copy[coluna] <= end_date)]

    return df_filtrado




def ultimo_dia_do_mes(data):
    """
    Retorna o último dia do mês correspondente à data fornecida.

    Argumentos:
        data (various): Pode ser uma string (ex: '2024-01-15'),
                        um objeto datetime.date, datetime.datetime, 
                        ou qualquer outro formato compatível com 'pd.to_datetime'.

    Retorna:
        pd.Timestamp: Representando o último dia do mês da data fornecida.
    """

    data_ts = pd.to_datetime(data, errors='coerce')
    if pd.isna(data_ts):
        raise ValueError(f"Não foi possível converter '{data}' para um objeto de data válido.")

    return data_ts + pd.offsets.MonthEnd(0)

def primeiro_dia_do_mes(data_param=None):
    """
    Recebe uma data em diferentes formatos (string ou objeto datetime)
    e retorna o primeiro dia do mês (objeto datetime).
    
    Se data_param não for fornecido, considera datetime.now().
    """
    if data_param is None:
        data_base = datetime.now()
    else:
        if isinstance(data_param, datetime):
            data_base = data_param
        else:
            data_base = parser.parse(data_param)
    
    return datetime(data_base.year, data_base.month, 1)