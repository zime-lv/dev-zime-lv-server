--- currency supply

SELECT (
    (
        SELECT (COUNT(*) * 1000) AS initial_credit
        FROM users
        WHERE uid IS NOT NULL
    )
) AS currency_supply

--- total assets

SELECT SUM(tp.amount) AS total_revenues
FROM transaction_positions AS tp

--- total liabilities

SELECT SUM(t.amount) AS total_expenses
FROM transactions AS t

--- total balanse (revenues - expenses)

SELECT (
    (
        SELECT SUM(tp.amount) AS total_revenues
        FROM transaction_positions AS tp
    ) - 
    (
        SELECT SUM(t.amount) AS total_expenses
        FROM transactions AS t
    )
) AS total_balance

--- expenses & revenues

        SELECT t.*, tp.*, t.amount AS expenses, SUM(tp.amount) AS revenues, (t.amount - SUM(tp.amount)) AS diff
        FROM transactions AS t
        INNER JOIN transaction_positions AS tp ON tp.transaction_id = t.transaction_id
        GROUP BY tp.transaction_id
        HAVING diff != 0

--- user assets

SELECT (
    (
        SELECT 1000 AS initial_credit
    ) +
    (
        SELECT SUM(tp.amount) AS revenues
        FROM transaction_positions AS tp
        WHERE tp.recipient_id = '100370-10405'
    )
) AS assets

--- user liabilities

SELECT SUM(t.amount) AS liabilities
FROM transactions AS t 
WHERE t.sender_id = '100370-10405'

--- user assets & liabilities

SELECT "assets", (
    (
        SELECT 1000 AS initial_credit
    ) +
    (
        SELECT SUM(tp.amount) AS revenues
        FROM transaction_positions AS tp
        WHERE tp.recipient_id = '100370-10405'
    )
) AS assets

UNION ALL

SELECT "liabilities", SUM(t.amount) AS liabilities
FROM transactions AS t 
WHERE t.sender_id = '100370-10405'

--- initial credit

SELECT 1000 AS initial_credit

--- revenues

SELECT SUM(tp.amount) AS revenues
FROM transaction_positions AS tp
WHERE tp.recipient_id = '100370-10405'

--- expenses

    SELECT SUM(t.amount) AS expenses
    FROM transactions AS t 
    WHERE t.sender_id = '100370-10405'


--- Nominal balance

SELECT (
    SELECT (
        (
            SELECT 1000 AS initial_credit
        ) +
        (
            SELECT SUM(tp.amount) AS revenues
            FROM transaction_positions AS tp
            WHERE tp.recipient_id = '100370-10405'
        )
    ) AS assets
) - (
    SELECT SUM(t.amount) AS liabilities
    FROM transactions AS t 
    WHERE t.sender_id = '100370-10405'
) AS nominal_balance

--- Actual balance

SELECT (acc_curr + acc_cred + acc_save) AS actual_balance
FROM users
WHERE uid = '100370-10405'

--- Balance difference specific user

SELECT (
    (
        SELECT (acc_curr + acc_cred + acc_save) AS actual_balance
        FROM users
        WHERE uid = '100370-10405'
    ) - 
    (   
        SELECT (
            SELECT (
                SELECT (
                    (
                        SELECT 1000 AS initial_credit
                    ) +
                    (
                        SELECT SUM(tp.amount) AS revenues
                        FROM transaction_positions AS tp
                        WHERE tp.recipient_id = '100370-10405'
                    )
                ) AS assets
            ) - (
                SELECT SUM(t.amount) AS liabilities
                FROM transactions AS t 
                WHERE t.sender_id = '100370-10405'
            )
        )
    ) 
) as balance_difference

--- Balance difference all users

SELECT COALESCE(
    (
        (   
            SELECT (
                SELECT (
                    SELECT (
                        (
                            SELECT 1000 AS initial_credit
                        ) +
                        (
                            SELECT SUM(tp.amount) AS revenues
                            FROM transaction_positions AS tp
                            WHERE tp.recipient_id = u2.uid
                        )
                    ) AS assets
                ) - (
                    SELECT SUM(t.amount) AS liabilities
                    FROM transactions AS t 
                    WHERE t.sender_id = u2.uid
                )
            ) AS nominal_balance
        ) - 

        (
            SELECT (acc_curr + acc_cred + acc_save) AS actual_balance
            FROM users
            WHERE uid = u2.uid
        )

    ), 0
) as balance_difference, u2.uid 
FROM users AS u2
WHERE u2.uid IS NOT NULL
HAVING balance_difference != 0


--- Compensate the difference

CREATE TEMPORARY TABLE balance_difference
SELECT COALESCE(
    (
        (   
            SELECT (
                SELECT (
                    SELECT (
                        (
                            SELECT 1000 AS initial_credit
                        ) +
                        (
                            SELECT SUM(tp.amount) AS revenues
                            FROM transaction_positions AS tp
                            WHERE tp.recipient_id = u2.uid
                        )
                    ) AS assets
                ) - (
                    SELECT SUM(t.amount) AS liabilities
                    FROM transactions AS t 
                    WHERE t.sender_id = u2.uid
                )
            ) AS nominal_balance
        ) - 

        (
            SELECT (acc_curr + acc_cred + acc_save) AS actual_balance
            FROM users
            WHERE uid = u2.uid
        )

    ), 0
) as balance_difference, u2.uid 
FROM users AS u2
WHERE u2.uid IS NOT NULL
HAVING balance_difference != 0;

-- SELECT * FROM balance_difference;

UPDATE users AS u
INNER JOIN balance_difference AS bd ON bd.uid = u.uid
SET u.acc_save = u.acc_save + bd.balance_difference;

DROP TEMPORARY TABLE balance_difference;




