-- (1)
-- In SSH:
-- -> copy config.sample.inc.php to config.inc.php:
-- -> cp /usr/local/psa/admin/htdocs/domains/databases/phpMyAdmin/config.sample.inc.php /usr/local/psa/admin/htdocs/domains/databases/phpMyAdmin/config.inc.php
-- -> Go to directory: cd /usr/local/psa/admin/htdocs/domains/databases/phpMyAdmin/

-- (2)
-- In config.inc.php:
-- -> declare(strict_types=1);
-- -> $cfg['AllowArbitraryServer'] = true;
-- -> Delete everything else

-- (2a)
-- In Plesk:
-- -> Databases -> (select subscription: local-currency.com) -> Database servers -> Click: Toolbox (right side)
-- -> Click: Replication -> If configured as master: SSH -> etc/my.cnf.d, remove master entries under [mysqld], then restart mysql server: systemctl restart mariadb
-- -> (Click: Replication again, if necessary) -> Slave replication/click: configure

-- (3)
-- In /etc/my.cnf.d/server.cnf:
-- [mysqld]
-- server-id=1590821112 (use the suggested)
-- replicate-do-db=dev_zimelv
-- relay-log=mariadb-relay-bin
-- report-host=zime2 (or zime1)

-- (4)
-- SSH restart server:
-- systemctl restart mariadb

-- (5)
-- On dev_zimelv database:
-- -> Select DB: dev_zimelv or zimelv
-- NB: MASTER_HOST='85.215.83.36', -- 85.214.146.139 | 85.215.83.36
CHANGE master to
MASTER_HOST='85.215.83.36',
MASTER_USER='replicator',
MASTER_PASSWORD='wzudf_19646_HCSI'

-- (6)
-- On dev_zimelv database:
start slave

-- (7)
-- SSH restart server:
-- systemctl restart mariadb

-----------------------------------------

-- For replication arrangement A -> B -> C:
-- In /etc/my.cnf.d/server.cnf:
-- log_slave_updates=ON

-----------------------------------------

-- To remove slave
STOP SLAVE
RESET SLAVE ALL