## SELL ORDER TRANSACTION:

1. Create Sell order psbt
1.1 Send psbt to seller for signing
1.2 extract signature from input 0
1.3 create listing tx with p2wsh:
    - nLockTime 888
    - sequence 0xfffffffd (ALLOW RBF)
    - low mempool fee of 1 sat/vbyte
    - first input is the utxo to sell
    - first output is the seller with 546 satoshis
    - JSON p2wsh or OP_RETURN:
        - signed psbt signature
        - price
1.4 send listing tx seller for signing
1.5 send listing tx to network with really low fee

```
    Transaction:

    nLockTime: 800
    sequence: 0xfffffffd (ALLOW RBF)

    Inputs:
        1. - UTXO to sell
        2. - UTXO to pay for cancelling order
    Outputs:
        1.      - 546 UTXO to seller
        [2...n] - P2WSH data for the order containing:
            - signed psbt signature
            - seller
            - price
        n + 1.  - Change to seller
```
