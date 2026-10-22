<?php 


// VARIAVEIS PARA CONEXAO
    $host = 'localhost';
    $port = '3306';
    $user = 'root';
    $pass = 'mysql';
    $dbname = 'sprintmario_allana';


// PRINCIPAL
    try {

        // pdo = "Php Data Object"
        $pdo = new PDO(
        
            "mysql:host=$host; port=$port; charset=utf8mb4",
            $user,
            $pass,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                // "se tiver uma excecao, lança um erro la no catch"

                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                
            ]
            // "::" é a operação de escopo (o bloco aí, os cochetes)
            // ele vai pegar os dados sem precisar criar um objeto
            // como ele ja vem cm as classes, isso aí vai acessar a constante "excecao" que indica quando tem execoes
            // mesma logica de puxar o dado de um array

        );
        $pdo -> exec(
            "CREATE DATABASE IF NOT EXISTS `$dbname`"
        );
        // isso previne sql injection pq cria o banco de dados dnv
        
        $pdo -> exec(
            "USE `$dbname`"
            );
            
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS `ranking`(
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `nome` VARCHAR(50) NOT NULL,
        `pontuacao` INT NOT NULL,
        `data_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP) "
        );
        // isso previne sql injection pq cria a tabela dnv


    } catch (PDOException $e){
    // vai executar tudo e botar na variavel "e"

        http_response_code(500);
        // codigo de erro de servidor

        header('Content-Type: application/json; charset=utf-8');
        // informa o navegador que o erro vai ser passado pelo json

        echo json_encode([
        // json_encode -> tranforma o array em jso
            'status' => 'error',
            'message' => 'Nao foi possível conectar ao Banco de Dados. :/' . $e -> getMessage()
            ]);
        exit;
    }

?>