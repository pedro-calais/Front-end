/**
 * @file chamadoService.ts
 * @description Camada de serviço responsável por centralizar todas as chamadas HTTP
 * referentes ao módulo de Chamados/Suporte.
 * * Esta camada atua como uma ponte entre o Front-end (React) e a API Python (Flask).
 */

import type { ChamadoForm } from '../types/chamado';
// URL base da API (ajuste conforme ambiente: dev/prod)
const API_URL = ' https://noncomprehendingly-unrescissable-ismael.ngrok-free.dev -> http://localhost:5000'; 

/**
 * Envia uma requisição POST para o backend solicitando a abertura de um chamado no ClickUp.
 * * ---
 * **Onde esta função é usada:**
 * - Componente: `src/pages/AbrirChamado.tsx`
 * - Contexto: Dentro da função `handleSubmit`, disparada quando o usuário clica em "Enviar".
 * * ---
 * **O que esta função processa (Inputs):**
 * @param dados - Objeto do tipo `ChamadoForm` contendo os campos de texto (título, descrição, IDs, selects).
 * @param arquivos - Objeto `FileList` contendo os binários (blobs) dos arquivos anexados pelo usuário (ou null).
 * * ---
 * **Retorno (Outputs):**
 * @returns Promise que resolve com o JSON de resposta do backend (geralmente contendo o `task_id`).
 * @throws Error se a resposta HTTP não for 2xx.
 */
export const enviarChamado = async (dados: ChamadoForm, arquivos: FileList | null) => {
    
    // 1. Instanciação do FormData
    // Necessário porque estamos enviando dados complexos (Arquivos + Texto) na mesma requisição.
    // O JSON puro (application/json) não suporta upload de arquivos binários facilmente.
    const formData = new FormData();
    
    // 2. Mapeamento de Campos de Texto
    // Extrai os valores do objeto 'dados' e anexa ao corpo da requisição.
    formData.append('titulo', dados.titulo);
    formData.append('descricao', dados.descricao);
    formData.append('tipo_demanda', dados.tipoDemanda);
    formData.append('campanha', dados.campanha || ''); // Envia string vazia se for undefined
    formData.append('credor', dados.credor || '');
    formData.append('responsavel_id', dados.responsavelId);

    // 3. Processamento de Arquivos
    // Se houver arquivos, iteramos sobre a lista e anexamos cada um com a chave 'files'.
    // O backend Python usará `request.files.getlist('files')` para recuperar essa lista.
    if (arquivos && arquivos.length > 0) {
        Array.from(arquivos).forEach((file) => {
            formData.append('files', file);
        });
    }

    // 4. Execução da Chamada HTTP
    const response = await fetch(`${API_URL}/abrir-chamado`, {
        method: 'POST',
        body: formData,
        /**
         * NOTA IMPORTANTE DE ARQUITETURA:
         * Não definimos o header 'Content-Type' manualmente aqui.
         * * Motivo: Ao detectar um objeto `FormData` no body, o navegador automaticamente:
         * 1. Define o Content-Type como 'multipart/form-data'
         * 2. Gera e adiciona o 'boundary' necessário para separar os arquivos dos textos.
         * Se definirmos manualmente, o boundary é perdido e o upload falha.
         */
    });

    // 5. Tratamento de Erros da Camada de Rede
    if (!response.ok) {
        // Tenta ler a mensagem de erro enviada pelo Python, ou usa uma genérica
        let errorMessage = 'Falha na comunicação com o servidor';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            // Se o response não for JSON (ex: erro 500 html do nginx), mantém a msg genérica
        }
        throw new Error(errorMessage);
    }

    // 6. Retorno dos dados processados (ex: { success: true, task_id: "..." })
    return response.json();
};