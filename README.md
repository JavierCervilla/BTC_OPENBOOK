# BTC_OPENBOOK

OPENBOOK stands to be an easy way to track market data across platforms using atomic swaps.

Starting with Counterparty (Protocol 0)

example of transaction using this OP_RETURN
https://mempool.space/es/tx/4634ba56ab10dfddab1585fd4d078e0e5bb0e1af5f623b4bb03f7f79f31adc79

```mermaid
graph TB
    User((External User))

    subgraph "OpenBook System"
        subgraph "API Layer"
            ExpressApp["Express Server<br>Express.js"]
            
            subgraph "API Components"
                APIHandler["API Handler<br>Express"]
                APIRoutes["Route Controller<br>Express Router"]
                AuthMiddleware["Auth Middleware<br>Express"]
                MorganLogger["Request Logger<br>Morgan"]
            end
        end

        subgraph "Core Services"
            IndexerService["Indexer Service<br>TypeScript"]
            OpenBookProtocol["OpenBook Protocol<br>TypeScript"]
            DatabaseService["Database Service<br>SQLite"]

            subgraph "Indexer Components"
                BlockParser["Block Parser<br>TypeScript"]
                TxParser["Transaction Parser<br>TypeScript"]
                IndexerDB["DB Methods<br>SQLite"]
            end

            subgraph "Database Components"
                DBInit["DB Initializer<br>SQLite"]
                CacheManager["Cache Manager<br>SQLite"]
                PaginationUtil["Pagination Utility<br>TypeScript"]
            end
        end

        subgraph "External Integrations"
            BitcoinRPC["Bitcoin RPC<br>JSON-RPC"]
            XCPRPC["XCP RPC<br>JSON-RPC"]
            ElectrumRPC["Electrum RPC<br>JSON-RPC"]
        end

        subgraph "Data Models"
            AtomicSwaps["Atomic Swaps<br>SQLite"]
            OrdersBook["Orders Book<br>SQLite"]
            Blocks["Blocks<br>SQLite"]
        end

        subgraph "Utility Services"
            ConfigManager["Config Manager<br>TypeScript"]
            Logger["Logger Service<br>TypeScript"]
            StringifyUtil["Stringify Utility<br>TypeScript"]
        end
    end

    %% Relationships
    User -->|"HTTP Requests"| ExpressApp
    ExpressApp -->|"Routes Requests"| APIHandler
    APIHandler -->|"Delegates"| APIRoutes
    APIRoutes -->|"Uses"| AuthMiddleware
    APIRoutes -->|"Logs via"| MorganLogger

    IndexerService -->|"Parses"| BlockParser
    BlockParser -->|"Uses"| TxParser
    IndexerService -->|"Stores Data"| IndexerDB
    
    DatabaseService -->|"Initializes"| DBInit
    DatabaseService -->|"Manages"| CacheManager
    DatabaseService -->|"Uses"| PaginationUtil

    IndexerService -->|"Queries"| BitcoinRPC
    IndexerService -->|"Queries"| XCPRPC
    IndexerService -->|"Queries"| ElectrumRPC

    DatabaseService -->|"Manages"| AtomicSwaps
    DatabaseService -->|"Manages"| OrdersBook
    DatabaseService -->|"Manages"| Blocks

    ExpressApp -->|"Uses"| ConfigManager
    ExpressApp -->|"Logs via"| Logger
    APIHandler -->|"Uses"| StringifyUtil

    OpenBookProtocol -->|"Processes"| AtomicSwaps
    OpenBookProtocol -->|"Manages"| OrdersBook
```
