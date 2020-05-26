-- (1)
-- In SSH:
-- copy config.sample.inc.php to config.inc.php:
-- cp /usr/local/psa/admin/htdocs/domains/databases/phpMyAdmin/config.sample.inc.php /usr/local/psa/admin/htdocs/domains/databases/phpMyAdmin/config.inc.php

-- (2)
-- In config.inc.php:
-- declare(strict_types=1);
-- $cfg['AllowArbitraryServer'] = true;

-- (3)
-- In /etc/my.cnf.d/server.cnf:
-- [mysqld]
-- server-id=1590061440
-- replicate-do-db=dev_zimelv
-- relay-log=mariadb-relay-bin

-- (4)
-- SSH restart server:
-- systemctl restart mariadb

-- (5)
-- On dev_zimelv database:
CHANGE master to
MASTER_HOST='85.214.146.139',
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

STOP SLAVE
RESET SLAVE ALL