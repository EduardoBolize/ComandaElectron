import express from 'express';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import schedule from 'node-schedule';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const arquivoItens = path.join(__dirname, 'itens.txt');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function getPortFree() {
    return new Promise(res => {
        const srv = net.createServer();
        srv.listen(0, () => {
            const port = srv.address().port;
            srv.close(() => res(port));
        });
    });
}

async function startServer() {
    const PORT = await getPortFree();
    app.listen(PORT, () => {
        console.log(`Express server listening on port ${PORT}`);
    });
    return PORT;
}
// const PORT = 3000

let comandas = [];

const pagamentoOptions = ['Dinheiro', 'PIX', 'Credito', 'Debito']
    .map(metodo => `<option value="${metodo}">${metodo}</option>`).join('');

// Rota raiz - Página inicial com lista de comandas abertas e formulário para abrir nova comanda
app.get('/', (req, res) => {
    res.send(`
        <style>
            body {
                font-family: 'Roboto', sans-serif;
                text-align: center;
                background: #e0e0e0; /* Cor de fundo mais suave */
                color: #333; /* Texto escuro para melhor leitura */
                padding: 20px;
            }
            h1 {
                color: #4CAF50; /* Cor verde para títulos */
                margin-bottom: 20px;
            }
            .comandas-container {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
            }
            .comandas-col {
                flex: 1;
                text-align: left;
                background-color: #fff; /* Fundo branco para as colunas */
                border: 1px solid #ddd; /* Borda sutil */
                border-radius: 8px;
                padding: 20px;
                margin-right: 10px; /* Espaço entre as colunas */
                box-shadow: 0 2px 5px rgba(0,0,0,0.1); /* Sombra sutil */
            }
            .comandas-col:last-child {
                margin-right: 0;
            }
            .comandas-link, .comandas-form button {
                display: block;
                background-color: #4CAF50;
                color: white;
                padding: 12px 24px;
                margin-bottom: 10px;
                border-radius: 8px;
                text-decoration: none;
                border: none;
                cursor: pointer;
                transition: background-color 0.3s;
                text-align: center;
            }
            .comandas-link:hover, .comandas-form button:hover {
                background-color: #45a049; /* Verde mais escuro ao passar o mouse */
            }
            .comandas-link.fechada, .comandas-link.fechada:hover {
                background-color: #FF5733; /* Vermelho para comandas fechadas */
                background-color: #e74c3c; /* Vermelho mais claro ao passar o mouse */
            }
            .comandas-form {
                flex: 0 0 40%;
                text-align: left;
            }
            .comandas-form input[type="text"], .comandas-form select {
                width: 100%;
                padding: 8px;
                margin-bottom: 20px;
                border: 1px solid #ccc;
                border-radius: 4px;
            }
            .action-button {
                background-color: #4CAF50;
                color: white;
                padding: 5px 10px;
                border: none;
                border-radius: 4px;
                transition: background-color 0.3s;
            }
            .action-button:hover {
                background-color: #45a049;
            }
            .action-button.alterar {
                background-color: #dddd16; /* Amarelo para botões de alterar */
            }
            .action-button.excluir {
                background-color: #e31b1b; /* Vermelho para botões de excluir */
            }
            .modal {
                display: none; /* Escondido por padrão */
                position: fixed; /* Fica fixo na tela */
                z-index: 2; /* Sita-se sobre tudo, exceto o modal */
                left: 0;
                top: 0;
                width: 100%; /* Largura total */
                height: 100%; /* Altura total */
                background-color: rgba(0,0,0,0.5); /* Preto com opacidade para escurecer a tela */
                overflow: auto; /* Permite rolagem se necessário */
            }
        
            /* Conteúdo do Modal */
            .modal-content {
                position: relative;
                background-color: #ffffff;
                margin: 10% auto; /* 10% do topo e centralizado horizontalmente */
                padding: 20px;
                border: 1px solid #ccc;
                width: 50%; /* 50% da largura da tela */
                box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
                animation-name: animatetop;
                animation-duration: 0.4s
            }
        
            /* Adiciona animação */
            @keyframes animatetop {
                from {top: -300px; opacity: 0}
                to {top: 0; opacity: 1}
            }
        
            /* Botão para fechar o modal */
            .close {
                color: #aaaaaa;
                float: right;
                font-size: 28px;
                font-weight: bold;
                margin-right: -10px;
                margin-top: -10px;
            }
        
            .close:hover,
            .close:focus {
                color: #000;
                text-decoration: none;
                cursor: pointer;
            }
        
            /* Ajustes no botão */
            .modal-footer {
                padding: 12px 16px;
                text-align: right;
                border-top: 1px solid #e5e5e5;
            }
        
            .modal-footer button {
                padding: 10px 20px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.3s;
            }
        
            .modal-footer button:hover {
                background-color: #45a049;
            }

            /* Media Queries para Responsividade */
            @media only screen and (max-width: 480px) {
                body {
                    padding: 10px; /* Reduzir o padding geral para mais espaço de tela */
                    font-size: 14px; /* Ajustar o tamanho da fonte geral para melhor legibilidade */
                }
        
                h1, .comandas-link, .comandas-form button, .action-button {
                    font-size: 16px; /* Tamanho da fonte maior para legibilidade */
                }
        
                .comandas-container {
                    flex-direction: column; /* Colunas em bloco, uma abaixo da outra */
                }
        
                .comandas-col, .comandas-form {
                    width: 100%; /* Cada coluna usa 100% da largura da tela */
                    margin-right: 0;
                    margin-bottom: 10px; /* Adiciona margem abaixo */
                    box-shadow: none; /* Remove sombra para teste */
                }

                .comandas-form button, .action-button {
                    font-size: 16px; /* Aumento do tamanho da fonte para botões */
                    padding: 12px 24px; /* Maior área de clique */
                }
        
                /* Estilos do modal ajustados para melhor visualização em smartphones */
                .modal-content {
                    width: 95%; /* Modal quase a largura total para aproveitar o espaço */
                    margin-top: 50px; /* Menos margem superior para que apareça mais centralizado */
                    padding: 15px; /* Padding interno reduzido */
                }
        
                .modal-footer {
                    padding: 10px; /* Padding reduzido no rodapé do modal */
                }
        
                .modal-footer button {
                    font-size: 14px; /* Ajuste no tamanho da fonte do botão no rodapé do modal */
                }
            }
        </style>
        <!-- O Modal -->
        <div id="myModal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <p id="modalText">Some text in the Modal..</p>
            </div>
        </div>
        <h1>Comandas</h1>
        <div class="comandas-container">
        <div class="comandas-col">
            <h2>Comandas Abertas</h2>
            <ul>
                ${comandas
            .filter(comanda => comanda.status === 'aberta')
            .map(comanda => `
                        <li class="comanda-item">
                            <div class="comanda-info">
                                <a class="comandas-link" href="/comandas/${comanda.id}">${comanda.nomeCliente} - Valor Total: R$ ${calcularValorTotal(comanda)}</a>
                            </div>
                            <div class="comanda-actions">
                                <button class="action-button alterar" onclick="alterarComanda('${comanda.id}')">Alterar</button>
                                <button class="action-button excluir" onclick="excluirComanda('${comanda.id}')">Excluir</button>
                            </div>
                        </li>
                    `).join('')
                }
            </ul>
        </div>
            <div class="comandas-form">
                <h2>Abrir Nova Comanda</h2>
                <form action="/comandas" method="post">
                    <label for="nomeCliente">Nome do Cliente:</label>
                    <input type="text" id="nomeCliente" name="nomeCliente" required>
                    <button type="submit">Abrir Comanda</button>
                </form>
                <form action="/exportar" method="get">
                    <button id="exportBtn">Exportar Dados</button>
                </form>
            </div>
            <div class="comandas-col">
                <h2>Comandas Fechadas</h2>
                <ul>
                    ${comandas
            .filter(comanda => comanda.status === 'fechada')
            .map(comanda => `
                            <li>
                                <a class="comandas-link fechada" href="/comandas/${comanda.id}">${comanda.nomeCliente} - Fechada - Valor Total: R$ ${calcularValorTotal(comanda)}</a>
                                <button onclick="alterarComanda('${comanda.id}')">Alterar</button>
                                <button onclick="excluirComanda('${comanda.id}')">Excluir</button>
                            </li>
                        `).join('')
        }
                </ul>
            </div>
        </div>
        <p>Gerencie as comandas e itens aqui.</p>
            <a href="/gerenciar-itens"><button class="action-button">Gestão de Itens</button></a>
        <script>
            // Pega o modal
            var modal = document.getElementById('myModal');

            // Pega o elemento <span> que fecha o modal
            var span = document.getElementsByClassName("close")[0];

            // Quando o usuário clica no <span> (x), fecha o modal
            span.onclick = function() {
                modal.style.display = "none";
            }

            // Quando o usuário clica em qualquer lugar fora do modal, fecha-o
            window.onclick = function(event) {
                if (event.target == modal) {
                    modal.style.display = "none";
                }
            }

            // Função para abrir o modal com uma mensagem
            function showModal(message) {
                document.getElementById('modalText').textContent = message;
                modal.style.display = "block";
            }

            document.getElementById('exportBtn').addEventListener('click', function(event) {
                event.preventDefault(); // Impede o comportamento padrão do formulário

                fetch('/exportar')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            showModal(data.message); // Exibe o modal com a mensagem de sucesso
                        } else {
                            showModal("Falha ao exportar os dados."); // Exibe o modal com a mensagem de falha
                        }
                    })
                    .catch(error => {
                        showModal("Erro ao exportar: " + error.message); // Exibe o modal com a mensagem de erro
                    });
            });

            // Função para alterar uma comanda
            function alterarComanda(idComanda) {
                // Novo nome que será solicitado ao usuário
                const novoNome = prompt('Digite o novo nome da comanda:');
                if (novoNome !== null && novoNome.trim() !== '') {
                    // Enviar uma requisição PUT para a rota de alterar comanda, passando o ID da comanda e o novo nome
                    fetch('/comandas/' + idComanda + '/nome', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ novoNome })
                    })
                    .then(response => {
                        if (response.ok) {
                            // Se a resposta for bem-sucedida, recarregar a página para exibir o novo nome
                            window.location.reload();
                        } else {
                            console.error('Erro ao alterar o nome da comanda:', response.status);
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao alterar o nome da comanda:', error);
                    });
                }
            }

            // Função para excluir uma comanda com confirmação
            function excluirComanda(idComanda) {
                // Exibir uma mensagem de confirmação ao usuário
                const confirmacao = confirm('Tem certeza que deseja excluir esta comanda?');
                if (confirmacao) {
                    // Enviar uma requisição DELETE para a rota de exclusão de comanda
                    fetch('/excluir-comanda/' + idComanda, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (response.ok) {
                            // Atualizar a página após a exclusão da comanda
                            window.location.reload();
                        } else {
                            console.error('Erro ao excluir a comanda:', response.status);
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao excluir a comanda:', error);
                    });
                }
            }
        </script>
    `);
});

// Rota para criar uma nova comanda
app.post('/comandas', (req, res) => {
    const { nomeCliente } = req.body;
    const novaComanda = {
        id: Date.now().toString(),
        nomeCliente,
        status: 'aberta',
        itens: [],
        pagamentos: [],
        valorTotal: 0,
        metodoPagamento: '',
        data: new Date()
    };
    comandas.push(novaComanda);
    res.redirect('/');
});

// Rota para rachar a conta
app.get('/comandas/:idComanda/rachar', (req, res) => {
    const { idComanda } = req.params;
    const comanda = comandas.find(comanda => comanda.id === idComanda);
    if (!comanda) {
        return res.status(404).send('Comanda não encontrada');
    }

    const valorTotal = calcularValorTotal(comanda);
    const valorPago = comanda.pagamentos.reduce((total, pagamento) => total + pagamento.valor, 0);
    const valorRestante = valorTotal - valorPago;

    res.send(`
        <style>
            body, input, button, select {
                font-family: 'Roboto', sans-serif;
            }
            .container {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px;
            }
            .modal-content {
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                width: 100%;
                max-width: 500px;
                margin-bottom: 20px;
            }
            button {
                background-color: #4CAF50;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.3s;
                width: 100%;
            }
            button:hover {
                background-color: #45a049;
            }
        </style>
        <div class="container">
            ${valorPago >= valorTotal ? `
                <div class="modal-content">
                    <h1>Conta já foi totalmente paga</h1>
                    <p>O total da conta foi R$${valorTotal.toFixed(2)}, e já foi completamente quitado.</p>
                    <button onclick="window.location.href='/'">Voltar</button>
                </div>` : `
                <div class="modal-content">
                    <h1>Rachar Conta</h1>
                    <p>Total da conta: R$ ${valorTotal.toFixed(2)}</p>
                    <p>Valor já pago: R$ ${valorPago.toFixed(2)}</p>
                    <p>Valor restante: R$ ${valorRestante.toFixed(2)}</p>
                    <form action="/comandas/${idComanda}/pagar" method="post">
                        <input type="number" name="valorPagar" min="0.01" max="${valorRestante.toFixed(2)}" step="0.01" required>
                        <select name="metodoPagamento">
                            ${pagamentoOptions}
                        </select>
                        <button type="submit">Pagar</button>
                    </form>
                    <button onclick="window.location.href='/'">Voltar Sem Rachar</button>
                </div>`
            }
        </div>
    `);
});

app.post('/comandas/:idComanda/rachar', (req, res) => {
    const { idComanda } = req.params;
    const { valorPagar, metodoPagamento } = req.body;
    const comanda = comandas.find(comanda => comanda.id === idComanda);

    if (!comanda) {
        return res.status(404).send('Comanda não encontrada');
    }

    const valorPagarFloat = parseFloat(valorPagar);
    if (isNaN(valorPagarFloat) || valorPagarFloat <= 0) {
        return res.status(400).send('Valor a pagar inválido');
    }

    const valorTotal = calcularValorTotal(comanda);
    const valorPago = comanda.pagamentos.reduce((sum, p) => sum + p.valor, 0);
    const valorRestante = valorTotal - valorPago;

    if (valorPagarFloat > valorRestante) {
        return res.status(400).send('Valor a pagar excede o valor restante na comanda');
    }

    if (!comanda.pagamentos) {
        comanda.pagamentos = [];
    }

    comanda.pagamentos.push({ valor: valorPagarFloat, metodo: metodoPagamento });

    if (valorRestante - valorPagarFloat <= 0) {
        comanda.status = 'fechada';  // Considera a comanda fechada se não houver mais valor a pagar
        res.redirect('/');
    } else {
        res.redirect(`/comandas/${idComanda}/rachar`);  // Continua no processo de rachar se ainda houver valor a pagar
    }
});

// Rota para pagar uma comanda integralmente ou adicionar pagamento
app.post('/comandas/:idComanda/pagar', (req, res) => {
    const { idComanda } = req.params;
    const { valorPagar, metodoPagamento } = req.body;
    const comanda = comandas.find(com => com.id === idComanda);

    if (!comanda) {
        return res.status(404).send('Comanda não encontrada');
    }

    const valorPagarFloat = parseFloat(valorPagar);
    if (isNaN(valorPagarFloat) || valorPagarFloat <= 0) {
        return res.status(400).send('Valor a pagar inválido');
    }

    if (!comanda.pagamentos) {
        comanda.pagamentos = [];
    }

    comanda.pagamentos.push({ valor: valorPagarFloat, metodo: metodoPagamento });

    const valorTotal = calcularValorTotal(comanda);
    const totalPago = comanda.pagamentos.reduce((acc, pagamento) => acc + pagamento.valor, 0);
    if (totalPago >= valorTotal) {
        comanda.status = 'fechada';
        res.redirect('/');  // Pode redirecionar para a tela inicial ou mostrar um recibo
    } else {
        res.redirect(`/comandas/${idComanda}/rachar`);
    }
});

// Rota para pagar a comanda integralmente
app.post('/comandas/:idComanda/fechar', (req, res) => {
    const { idComanda } = req.params;
    const { valorPagar, metodoPagamento } = req.body;
    const comanda = comandas.find(com => com.id === idComanda && com.status === 'aberta');

    if (!comanda) {
        return res.status(404).send('Comanda não encontrada ou já fechada');
    }

    const valorPagarFloat = parseFloat(valorPagar);
    if (isNaN(valorPagarFloat) || valorPagarFloat <= 0) {
        return res.status(400).send('Valor a pagar inválido');
    }

    if (!comanda.pagamentos) {
        comanda.pagamentos = [];
    }

    comanda.pagamentos.push({ valor: valorPagarFloat, metodo: metodoPagamento });

    comanda.status = 'fechada';
    res.redirect('/');
});

// Rota para visualizar o formulário de alteração de um item da comanda
app.get('/comandas/:idComanda/itens/:idItem/editar', (req, res) => {
    const { idComanda, idItem } = req.params;
    const comanda = comandas.find(comanda => comanda.id === idComanda);
    if (!comanda) {
        return res.status(404).send('Comanda não encontrada');
    }
    const item = comanda.itens.find(i => i.id === idItem);
    if (!item) {
        return res.status(404).send('Item não encontrado na comanda');
    }

    const itens = lerItens(); // Carrega os itens do arquivo TXT
    const options = itens.map(i => `<option value="${i.nome}" ${item.nome === i.nome ? 'selected' : ''}>${i.nome}</option>`).join('');
    
    res.send(`
        <h2>Alterar Item</h2>
        <form action="/comandas/${idComanda}/itens/${idItem}/atualizar" method="post">
            <select name="nomeItem" id="nomeItem">
                ${options}
            </select>
            <input type="number" name="preco" id="preco" value="${item.preco}" placeholder="Preço" step="0.01">
            <button type="submit">Salvar Alterações</button>
        </form>
    `);
});

// Rota para atualizar um item da comanda
app.post('/comandas/:idComanda/itens/:idItem/atualizar', (req, res) => {
    const { idComanda, idItem } = req.params;
    const { nomeItem, preco } = req.body;
    const comanda = comandas.find(comanda => comanda.id === idComanda);
    const itemIndex = comanda.itens.findIndex(i => i.id === idItem);

    if (itemIndex !== -1) {
        comanda.itens[itemIndex].nome = nomeItem;
        comanda.itens[itemIndex].preco = parseFloat(preco);
        // Salvar as mudanças, se necessário, ou enviar uma resposta
        res.send("Item atualizado com sucesso!");
    } else {
        res.status(404).send("Item não encontrado na comanda");
    }
});

// Rota para exibir uma comanda e opções para rachar a conta
app.get('/comandas/:idComanda', (req, res) => {
    const { idComanda } = req.params;
    const comanda = comandas.find(comanda => comanda.id === idComanda);
    if (!comanda) {
        return res.status(404).send('Comanda não encontrada');
    }

    const itens = lerItens(); // Carrega itens do arquivo
    
    let options = itens.map(item => `<option value="${item.nome}" data-preco="${item.preco}">${item.nome} - R$ ${item.preco}</option>`).join('');
    options += `<option value="Outro" data-preco="">Outro</option>`;

    const pagamentoOptions = ['Dinheiro', 'PIX', 'Credito', 'Debito'].map(metodo => `<option value="${metodo}">${metodo}</option>`).join('');


    res.send(`
        <style>
            body { font-family: 'Roboto', sans-serif; text-align: center; background: #e0e0e0; color: #333; padding: 20px; }
            h1, h2 { color: #4CAF50; margin-bottom: 20px; }
            ul { list-style-type: none; padding: 0; }
            li { margin-bottom: 5px; font-size: 16px; display: flex; align-items: center; justify-content: space-between; }
            .container { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; padding: 20px; }
            .coluna, .coluna-center { flex: 1; min-width: 300px; margin: 0 10px; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ccc; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .comanda-link, button, input[type="submit"] { background-color: #4CAF50; color: white; padding: 12px 24px; margin: 10px; border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.3s; text-decoration: none; display: inline-block; width: auto; }
            .comanda-link:hover, button:hover, input[type="submit"]:hover { background-color: #45a049; }
            form { display: flex; flex-direction: column; align-items: center; margin-top: 10px; }
            label { display: block; margin-bottom: 5px; }
            select, input[type="number"], input[type="text"] { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px; }
            input[type="number"] { width: auto; }
            .quantity-btn {
                border: none;
                background: none;
                cursor: pointer;
                color: #4CAF50; /* Cor verde para combinar com o tema */
            }
            .quantity-btn:hover {
                color: #45a049;
            }
        </style>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
        <h1>Comanda de ${comanda.nomeCliente}${comanda.status === 'fechada' ? ' - Fechada' : ''}</h1>
        <div class="container">
            <div class="coluna">
                <h2>Itens</h2>
                <ul>
                    ${comanda.itens.map(item => `
                        <li>
                            ${item.nome} (<span id="quantity-${item.id}">${item.quantidade}</span>x) - R$ ${item.preco * item.quantidade}
                            <div>
                                <button class="quantity-btn" onclick="updateItemQuantity('${idComanda}', '${item.id}', 1)"><i class="fas fa-plus"></i></button>
                                <button class="quantity-btn" onclick="updateItemQuantity('${idComanda}', '${item.id}', -1)"><i class="fas fa-minus"></i></button>
                                <button class="remover-item" data-comanda-id="${idComanda}" data-item-id="${item.id}">Remover</button>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="coluna-center">
                <h2>Adicionar Item</h2>
                <form action="/comandas/${idComanda}/itens" method="post">
                    <select name="nomeItem" id="nomeItem" onchange="mostrarCampos(this)">
                        ${options}
                    </select>
                    <input type="text" name="novoNomeItem" id="novoNomeItem" placeholder="Nome do item" style="display:none;">
                    <input type="number" name="quantidade" id="quantidade" value="1" min="1">
                    <input type="number" name="preco" id="preco" placeholder="Preço" step="0.01" required style="display:none;">
                    <button type="submit">Adicionar Item</button>
                </form>
            </div>
            <div class="coluna">
                <h2>Pagar Conta</h2>
                <form action="/comandas/${idComanda}/fechar" method="post">
                    <label for="valorPagar">Valor Total a Pagar: R$ ${calcularValorTotal(comanda).toFixed(2)}</label>
                    <input type="number" name="valorPagar" id="valorPagar" value="${calcularValorTotal(comanda).toFixed(2)}" min="0.01" step="0.01" readonly>
                    <label for="metodoPagamento">Forma de Pagamento:</label>
                    <select name="metodoPagamento" id="metodoPagamento">
                        ${pagamentoOptions}
                    </select>
                    <button type="submit">Pagar</button>
                </form>
                ${comanda.status === 'fechada' ? `<form action="/comandas/${idComanda}/reabrir" method="post">
                    <button type="submit">Reabrir Comanda</button>
                </form>` : ''}
                <form action="/comandas/${idComanda}/rachar" method="get">
                    <button type="submit">Pagar em Mais de uma Forma</button>
                </form>
            </div>
        </div>
        <br>
        <a href="/" class="comanda-link">Voltar para lista de comandas</a>
        <script>
            function updateItemQuantity(comandaId, itemId, increment) {
                const quantityDisplay = document.getElementById('quantity-' + itemId);
                let newQuantity = parseInt(quantityDisplay.textContent) + increment; // Usando textContent para pegar apenas o texto
        
                if (newQuantity < 1) {
                    // Confirmação para excluir o item se a quantidade for reduzida a zero
                    if (confirm('Tem certeza que deseja remover este item?')) {
                        removeItem(comandaId, itemId);
                    } else {
                        // Se o usuário cancelar, não fazer nada
                        return;
                    }
                } else {
                    // Atualizar a quantidade na interface do usuário imediatamente
                    quantityDisplay.textContent = newQuantity; // Atualiza apenas o número, sem adicionar 'x'
        
                    // Enviar a atualização para o servidor
                    fetch('/comandas/' + comandaId + '/itens/' + itemId + '/updateQuantity', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ newQuantity })
                    }).then(response => {
                        if (!response.ok) {
                            console.error('Erro ao atualizar quantidade:', response.statusText);
                            throw new Error('Falha ao atualizar a quantidade do item.');
                        }
                        location.reload(); // Recarregar a página para refletir a mudança
                    }).catch(error => {
                        alert('Erro ao atualizar a quantidade do item: ' + error.message);
                    });
                }
            }
        
            function removeItem(comandaId, itemId) {
                fetch('/comandas/' + comandaId + '/itens/' + itemId, {
                    method: 'DELETE'
                }).then(response => {
                    if (!response.ok) {
                        console.error('Erro ao remover item:', response.statusText);
                        throw new Error('Falha ao remover o item.');
                    }
                    location.reload(); // Recarregar a página após remover o item
                }).catch(error => {
                    alert('Erro ao remover o item: ' + error.message);
                });
            }

            document.querySelectorAll('.remover-item').forEach(button => {
                button.addEventListener('click', () => {
                    const comandaId = button.getAttribute('data-comanda-id');
                    const itemId = button.getAttribute('data-item-id');
            
                    // Adicionando confirmação para excluir o item
                    const confirmacao = confirm('Tem certeza que deseja remover este item?');
                    if (confirmacao) {
                        fetch('/comandas/' + comandaId + '/itens/' + itemId, {
                            method: 'DELETE'
                        }).then(response => {
                            if (response.ok) {
                                location.reload(); // Recarrega a página para refletir a alteração
                            } else {
                                alert('Falha ao remover o item. Por favor, tente novamente.');
                            }
                        }).catch(error => {
                            alert('Erro ao tentar remover o item: ' + error.message);
                        });
                    }
                });
            });
            

            function mostrarCampos(select) {
                const outroCampo = document.getElementById('novoNomeItem');
                const precoCampo = document.getElementById('preco');
                if (select.value === 'Outro') {
                    outroCampo.style.display = 'block';
                    precoCampo.style.display = 'block';
                    outroCampo.value = ''; // Clear previous input
                    precoCampo.value = ''; // Clear previous input
                } else {
                    outroCampo.style.display = 'none';
                    precoCampo.style.display = 'none';
                    const selectedItem = select.options[select.selectedIndex];
                    precoCampo.value = selectedItem.getAttribute('data-preco'); // Set to the selected item's price
                }
            }
        </script>
    `);
});

app.post('/comandas/:idComanda/itens/:idItem/updateQuantity', (req, res) => {
    const { idComanda, idItem } = req.params;
    const { newQuantity } = req.body;

    let comanda = comandas.find(com => com.id === idComanda);
    if (!comanda) {
        return res.status(404).send('Comanda não encontrada');
    }

    let item = comanda.itens.find(it => it.id === idItem);
    if (!item) {
        return res.status(404).send('Item não encontrado');
    }

    if (newQuantity < 1) {
        const itemIndex = comanda.itens.findIndex(it => it.id === idItem);
        comanda.itens.splice(itemIndex, 1); // Remover item se a quantidade for zero
    } else {
        item.quantidade = newQuantity; // Atualizar quantidade
    }

    res.status(200).send('Quantidade atualizada');
});

// Rota unificada para gerenciar itens (adicionar, atualizar, remover)
app.get('/gerenciar-itens', (req, res) => {
    const itens = lerItens();
    const itemOptions = itens.map(item => `<option value="${item.nome}" data-preco="${item.preco}">${item.nome} - R$${item.preco}</option>`).join('');

    res.send(`
        <style>
            body {
                font-family: 'Roboto', sans-serif;
                text-align: center;
                background: #e0e0e0;
                color: #333;
                padding: 20px;
            }
            h1 {
                color: #4CAF50;
                margin-bottom: 20px;
            }
            .item-management {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
            }
            .item-section {
                flex: 1;
                margin: 0 10px;
                background: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            ul {
                list-style-type: none;
                padding: 0;
            }
            li {
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            button, input, select {
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                margin: 4px;
                cursor: pointer;
                transition: background-color 0.3s;
                width: auto;
            }
            button:hover {
                background-color: #45a049;
            }
            input, select {
                color: black;
                background-color: white;
                width: calc(100% - 24px);
            }
            label {
                margin-top: 10px;
                display: block;
            }
            .back-button {
                margin-top: 20px;
            }
        </style>
        <h1>Gestão de Itens</h1>
        <div class="item-management">
            <div class="item-section">
                <h2>Adicionar Novo Item</h2>
                <form onsubmit="addItem(event)">
                    <input type="text" name="nome" placeholder="Nome do Item" required>
                    <input type="number" name="preco" placeholder="Preço" required>
                    <button type="submit">Adicionar Item</button>
                </form>
            </div>
            <div class="item-section">
                <h2>Atualizar/Remover Item</h2>
                <select id="itemAtual" onchange="onSelectItemChange()">${itemOptions}</select>
                <input type="text" id="novoNome" placeholder="Novo Nome do Item" required>
                <input type="number" id="novoPreco" placeholder="Novo Preço" required>
                <button onclick="updateItem()">Atualizar Item</button>
                <button onclick="removeItem(document.getElementById('itemAtual').value)" class="action-button excluir">Remover Item</button>
            </div>
        </div>
        <button class="back-button" onclick="window.location.href='/'">Voltar para a Tela Inicial</button>
        <script>
            let currentItem = {};

            function onSelectItemChange() {
                const select = document.getElementById('itemAtual');
                const selectedOption = select.options[select.selectedIndex];
                currentItem.nome = selectedOption.text.split(' - ')[0];
                currentItem.preco = selectedOption.getAttribute('data-preco');
                document.getElementById('novoNome').value = currentItem.nome;
                document.getElementById('novoPreco').value = currentItem.preco;
            }

            function addItem(event) {
                event.preventDefault();
                const nome = event.target.nome.value;
                const preco = parseFloat(event.target.preco.value);
                fetch('/itens', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({nome, preco})
                }).then(response => response.text())
                  .then(data => {
                      alert(data);
                      location.reload();
                });
            }

            function updateItem() {
                const nomeNovo = document.getElementById('novoNome').value;
                const precoNovo = parseFloat(document.getElementById('novoPreco').value);
                if (nomeNovo === currentItem.nome && precoNovo === parseFloat(currentItem.preco)) {
                    alert('Nenhuma alteração detectada.');
                    return;
                }
                fetch('/itens', {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({nomeAntigo: currentItem.nome, nomeNovo, precoNovo})
                }).then(response => response.text())
                  .then(data => {
                      alert(data);
                      location.reload();
                });
            }

            function removeItem(nome) {
                if (!confirm('Tem certeza que deseja remover este item?')) return;
                fetch('/itens', {
                    method: 'DELETE',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({nome})
                }).then(response => response.text())
                  .then(data => {
                      alert(data);
                      location.reload();
                });
            }
        </script>
    `);
});

// Rota para adicionar, atualizar e remover itens com métodos POST, PUT e DELETE
app.post('/itens', (req, res) => {
    const { nome, preco } = req.body;
    const itens = lerItens();
    itens.push({ nome, preco: parseFloat(preco) });
    escreverItens(itens);
    res.send('Item adicionado com sucesso');
});

app.put('/itens', (req, res) => {
    const { nomeAntigo, nomeNovo, precoNovo } = req.body;
    const itens = lerItens();
    const index = itens.findIndex(item => item.nome === nomeAntigo);
    if (index === -1) {
        res.status(404).send('Item não encontrado');
        return;
    }
    itens[index] = { nome: nomeNovo, preco: parseFloat(precoNovo) };
    escreverItens(itens);
    res.send('Item atualizado com sucesso');
});

app.delete('/itens', (req, res) => {
    const { nome } = req.body;
    const itens = lerItens();
    const novosItens = itens.filter(item => item.nome !== nome);
    if (itens.length === novosItens.length) {
        res.status(404).send('Item não encontrado');
        return;
    }
    escreverItens(novosItens);
    res.send('Item removido com sucesso');
});

// Rota para reabrir uma comanda fechada
app.post('/comandas/:idComanda/reabrir', (req, res) => {
    const { idComanda } = req.params;
    const comanda = comandas.find(comanda => comanda.id === idComanda);
    if (!comanda) {
        return res.status(404).send('Comanda não encontrada');
    }
    comanda.status = 'aberta';
    res.redirect(`/comandas/${idComanda}`);
});

// Rota para adicionar um item à comanda
app.post('/comandas/:idComanda/itens', (req, res) => {
    const { idComanda } = req.params;
    const { nomeItem, novoNomeItem, quantidade, preco } = req.body;
    let nome = nomeItem === 'Outro' ? novoNomeItem.trim() : nomeItem;
    let itemPreco = parseFloat(preco);

    if (nomeItem === 'Outro' && (isNaN(itemPreco) || itemPreco <= 0)) {
        res.send(`<script>
            alert('Preço inválido. Insira um valor maior que zero.');
            window.history.back();
        </script>`);
        return;
    }

    const comanda = comandas.find(comanda => comanda.id === idComanda);
    if (!comanda) {
        return res.status(404).send('Comanda não encontrada');
    }

    const item = {
        id: Date.now().toString(),
        nome,
        quantidade: parseInt(quantidade, 10),
        preco: itemPreco
    };

    comanda.itens.push(item);

    if (nomeItem === 'Outro') {
        const itens = lerItens();
        itens.push({ nome, preco: itemPreco });
        escreverItens(itens);
    }

    res.redirect(`/comandas/${idComanda}`);
});

// Rota para exportar dados
app.get('/exportar', (req, res) => {
    const message = realizarExportacao();
    res.json({ success: true, message });
});

// Rota para alterar o nome de uma comanda
app.put('/comandas/:idComanda/nome', (req, res) => {
    const { idComanda } = req.params;
    const { novoNome } = req.body;
    const comanda = comandas.find(comanda => comanda.id === idComanda && comanda.status === 'aberta');
    if (!comanda) {
        return res.status(404).send('Comanda não encontrada ou já fechada');
    }
    comanda.nomeCliente = novoNome;
    res.send('Nome da comanda alterado com sucesso');
});

// Rota para alterar o nome de um item em uma comanda
app.put('/comandas/:idComanda/itens/:idItem/nome', (req, res) => {
    const { idComanda, idItem } = req.params;
    const { novoNome } = req.body;
    const comanda = comandas.find(comanda => comanda.id === idComanda && comanda.status === 'aberta');
    if (!comanda) {
        return res.status(404).send('Comanda não encontrada ou já fechada');
    }
    const item = comanda.itens.find(item => item.id === idItem);
    if (!item) {
        return res.status(404).send('Item não encontrado na comanda');
    }
    item.nome = novoNome;
    res.send('Nome do item alterado com sucesso');
});

// Rota para alterar o método de pagamento de uma comanda fechada
app.put('/comandas/:idComanda/metodo-pagamento', (req, res) => {
    const { idComanda } = req.params;
    const { novoMetodo } = req.body;
    const comanda = comandas.find(comanda => comanda.id === idComanda && comanda.status === 'fechada');
    if (!comanda) {
        return res.status(404).send('Comanda não encontrada ou ainda aberta');
    }
    comanda.metodoPagamento = novoMetodo;
    res.send('Método de pagamento da comanda alterado com sucesso');
});

app.delete('/excluir-comanda/:idComanda', (req, res) => {
    const { idComanda } = req.params;

    // Aqui você precisa implementar a lógica para excluir a comanda com o ID fornecido
    // Por exemplo, você pode ter um array de comandas e remover a comanda com o ID correspondente
    // Vou fornecer um exemplo simplificado usando um array de comandas:

    const index = comandas.findIndex(comanda => comanda.id === idComanda);
    if (index !== -1) {
        // Remove a comanda do array
        comandas.splice(index, 1);
        res.sendStatus(204); // Envie uma resposta indicando que a comanda foi excluída com sucesso
    } else {
        res.status(404).send('Comanda não encontrada'); // Se a comanda não for encontrada, envie uma resposta 404
    }
});

// Rota para adicionar um item à lista de itens cadastrados
app.post('/itens', (req, res) => {
    const { nome, preco } = req.body;
    const novoItem = {
        id: Date.now().toString(),
        nome,
        preco
    };
    // Aqui você pode adicionar validações adicionais, se necessário
    itens.push(novoItem);
    res.send('Item cadastrado com sucesso');
});

// Rota para atualizar um item na lista de itens cadastrados
app.put('/itens/:idItem', (req, res) => {
    const { idItem } = req.params;
    const { nome, preco } = req.body;
    const itemIndex = itens.findIndex(item => item.id === idItem);
    if (itemIndex === -1) {
        return res.status(404).send('Item não encontrado');
    }
    // Aqui você pode adicionar validações adicionais, se necessário
    itens[itemIndex].nome = nome;
    itens[itemIndex].preco = preco;
    res.send('Item atualizado com sucesso');
});

// Rota para remover um item da comanda
app.delete('/comandas/:idComanda/itens/:idItem', (req, res) => {
    const { idComanda, idItem } = req.params;
    const comanda = comandas.find(comanda => comanda.id === idComanda);
    if (!comanda) {
        return res.status(404).send('Comanda não encontrada');
    }
    const itemIndex = comanda.itens.findIndex(item => item.id === idItem);
    if (itemIndex === -1) {
        return res.status(404).send('Item não encontrado na comanda');
    }
    comanda.itens.splice(itemIndex, 1);
    res.sendStatus(204); // No Content
});

// Rota para remover um item da comanda
app.get('/comandas/:idComanda/itens/:idItem/remover', (req, res) => {
    const { idComanda, idItem } = req.params;
    const comanda = comandas.find(comanda => comanda.id === idComanda);
    if (!comanda) {
        return res.status(404).send('Comanda não encontrada');
    }
    const index = comanda.itens.findIndex(item => item.id === idItem);
    if (index === -1) {
        return res.status(404).send('Item não encontrado na comanda');
    }
    const itemRemovido = comanda.itens.splice(index, 1);
    comanda.valorTotal -= itemRemovido[0].preco;
    res.redirect(`/comandas/${idComanda}`);
});

// Função para calcular o valor total de uma comanda
function calcularValorTotal(comanda) {
    return comanda.itens.reduce((total, item) => total + item.preco * item.quantidade, 0);
}

// Função auxiliar para calcular o total por forma de pagamento
function calcularTotaisPorPagamento(comandas) {
    let totalPorPagamento = { Dinheiro: 0, PIX: 0, Credito: 0, Debito: 0 };
    comandas.forEach(comanda => {
        (comanda.pagamentos || []).forEach(pagamento => {
            if (pagamento.valor && pagamento.metodo) {
                if (!totalPorPagamento.hasOwnProperty(pagamento.metodo)) {
                    totalPorPagamento[pagamento.metodo] = 0;  // Inicializa se não existir ainda
                }
                totalPorPagamento[pagamento.metodo] += pagamento.valor;
            }
        });
    });
    return totalPorPagamento;
}

function lerItens() {
    const data = fs.readFileSync(arquivoItens, 'utf-8');
    return data.split('\n')
        .filter(line => line.trim())
        .map(line => {
            const [nome, preco] = line.split(',');
            return { nome, preco: parseFloat(preco) };
        });
}

function escreverItens(itens) {
    const conteudo = itens.map(item => `${item.nome},${item.preco}`).join('\n');
    fs.writeFileSync(arquivoItens, conteudo, 'utf-8');
}

function realizarExportacao() {
    const data = new Date();
    const pasta = './registros';
    const arquivo = `registros_${data.getFullYear()}_${data.getMonth() + 1}_${data.getDate()}.txt`;
    const caminhoCompleto = `${pasta}/${arquivo}`;

    if (!fs.existsSync(pasta)) {
        fs.mkdirSync(pasta);
    }

    let conteudo = '';
    let totalVendido = 0;
    let totalPorPagamento = calcularTotaisPorPagamento(comandas);

    comandas.forEach(comanda => {
        let valorTotalComanda = calcularValorTotal(comanda);
        conteudo += `Comanda de ${comanda.nomeCliente} - Valor Total: R$ ${valorTotalComanda.toFixed(2)}\n`;
        comanda.itens.forEach(item => {
            conteudo += `${item.nome} (Quantidade: ${item.quantidade}) - R$ ${(item.preco * item.quantidade).toFixed(2)}\n`;
            totalVendido += item.preco * item.quantidade;
        });
        conteudo += '\n';
    });

    conteudo += `Total Vendido: R$ ${totalVendido.toFixed(2)}\n`;
    conteudo += `Total por Forma de Pagamento:\n`;
    Object.entries(totalPorPagamento).forEach(([metodo, valor]) => {
        conteudo += `${metodo}: R$ ${valor.toFixed(2)}\n`;
    });

    fs.writeFileSync(caminhoCompleto, conteudo);
    return `Dados exportados com sucesso para '${caminhoCompleto}'`;
}

// Agendamento usando node-schedule
schedule.scheduleJob('*/30 * * * *', () => {
    const resultado = realizarExportacao();
});

export { app, startServer };