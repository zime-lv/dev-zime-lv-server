-- (0) MASTER / SLAVE(S)
-- Adding database to existing replication:
-- Make sure both tables are replicated:
-- In /etc/my.cnf.d/server.cnf:
--       -> replicate-do-db          = zimelv
--       -> replicate-do-db          = dev_zimelv
--       -> binlog-do-db            = zimelv
--       -> binlog-do-db            = dev_zimelv
-- In SSH -> Restart DB on MASTER / SLAVE(S): systemctl restart mariadb

-- (1) MASTER
-- Activate SSH access:
-- Plesk -> Websites & Domains -> [Domain] -> Web hosting access -> Access to the server over SSH -> /usr/bin/bash

-- (2) MASTER
-- Plesk -> Databases -> Database severs -> click on Host name (localhost) 
--       -> Check option: Allow local MySQL server to accept external connections

-- (3) MASTER
-- Plesk -> Databases -> Database severs -> (select the server) -> click on Toolbox (right side), -- PhpMyAdmin opens
--       -> Click: Replication -> Master replication/click: configure -> Select: Ignore all databases; Replicate:
--       -> Select dev_zimelv and/or zimelv

-- (4) MASTER
-- In /etc/my.cnf.d/server.cnf:
-- -> [mysqld]
-- -> server-id=... (use the suggested id)
-- -> log_bin=mysql-bin
-- -> log_error=mysql-bin.err
-- -> binlog_do_db=dev_zimelv
-- -> innodb_flush_log_at_trx_commit=1
-- -> sync_binlog=1

-- (5) MASTER
-- In SSH -> Restart DB: systemctl restart mariadb

-- (6) MASTER
-- In PhpMyAdmin:
-- Click: Go

-- (7) MASTER
-- Plesk -> Tools & Settings -> Security/Firewall -> MySQL server -> Modify Plesk Firewall rules 
--       -> Allow from selected sources, deny from others -> Add IP address or network: 85.215.83.36 (zime2) or 85.214.146.139 (zime1)
--       -> Apply changes -> Activate

-- (8) MASTER
-- -> Select the DB (dev_zimelv or zimelv)
flush tables with read lock
show master status
-- Write down (probably not necessary):
-- mysql-bin.000008
-- 245
-- zimelv,dev_zimelv

-- (9) MASTER
-- On SSH:
mysqldump --user=u501809312753 --password=pmKdzo_732Hg5 dev_zimelv --master-data > dev_zimelv.sql
mysqldump --user=u501809312753 --password=pmKdzo_732Hg5 zimelv --master-data > zimelv.sql
zip -r dev_zimelv.zip dev_zimelv.sql
zip -r zimelv.zip zimelv.sql

-- (10) MASTER
----- FLUSH LOGS;
----- SET GLOBAL binlog_format = 'MIXED';
FLUSH LOGS;
UNLOCK TABLES;

-- (11) MASTER / SLAVE
-- On SSH:
-- Copy the zip-file to the slave /-directory, then
unzip -d / dev_zimelv.zip
unzip -d / zimelv.zip

-- (12) MASTER / SLAVE
-- On both master AND slave:
-- -> Select db: dev_zimelv or zimelv
-- -> Create a replicator user:
GRANT REPLICATION SLAVE ON * . * TO 'replicator'@'%'
IDENTIFIED BY 'wzudf_19646_HCSI' WITH MAX_QUERIES_PER_HOUR 0
MAX_CONNECTIONS_PER_HOUR 0 MAX_UPDATES_PER_HOUR 0
MAX_USER_CONNECTIONS 0 ;

-- (13) SLAVE
-- In SSH:
-- -> copy config.sample.inc.php to config.inc.php:
-- -> cp /usr/local/psa/admin/htdocs/domains/databases/phpMyAdmin/config.sample.inc.php /usr/local/psa/admin/htdocs/domains/databases/phpMyAdmin/config.inc.php
-- -> Go to directory: cd /usr/local/psa/admin/htdocs/domains/databases/phpMyAdmin/

-- (14) SLAVE
-- In config.inc.php:
-- -> declare(strict_types=1);
-- -> $cfg['AllowArbitraryServer'] = true;
-- -> Delete everything else

-- (15) SLAVE
-- In Plesk:
-- -> Databases -> (select subscription: local-currency.com) -> Database servers -> Click: Toolbox (right side)
-- -> Click: Replication -> If configured as master: SSH -> etc/my.cnf.d, remove master entries under [mysqld], then restart mysql server: systemctl restart mariadb
-- -> (Click: Replication again, if necessary) -> Slave replication/click: configure

-- (16) SLAVE
-- In /etc/my.cnf.d/server.cnf:
-- [mysqld]
-- server-id=1590821112 (use the suggested)
-- replicate-do-db=dev_zimelv
-- relay-log=mariadb-relay-bin
-- log_slave_updates=ON # this slave can become a master
-- report-host=zime2 (or zime1)

-- (17) SLAVE
-- SSH restart server:
-- systemctl restart mariadb

-- (19) SLAVE
-- On the slave, in DB (dev_zimelv or zimelv):
STOP SLAVE

-- (18) SLAVE
-- On dev_zimelv (or zimelv) database:
-- -> Select DB: dev_zimelv or zimelv
-- NB: MASTER_HOST='85.215.83.36', -- 85.214.146.139 | 85.215.83.36
CHANGE master to
MASTER_HOST='85.215.83.36',
MASTER_USER='replicator',
MASTER_PASSWORD='wzudf_19646_HCSI'



-- (20) SLAVE
create database dev_zimelv
create database zimelv

-- (21) SLAVE
-- Write the sql dump to the db:
-- On SSH (NB: adjust for zimelv or dev_zimelv):
mysql --user=u501809312753 --password=pmKdzo_732Hg5 dev_zimelv < dev_zimelv.sql
mysql --user=u501809312753 --password=pmKdzo_732Hg5 zimelv < zimelv.sql

-- (22) MASTER / SLAVE
-- On SSH restart server: 
-- systemctl restart mariadb

-- (23) SLAVE
START SLAVE

-- (24) MASTER
-- On master, show slave hosts:
SHOW SLAVE HOSTS


-- ===================================================================
-- If MASTER bocomes unavailable: Switch to MASTER 2

-- (1) SLAVE
STOP SLAVE IO_THREAD
-- -> check the output of: 
SHOW PROCESSLIST
-- until you see: Slave has read all relay log.

-- (2) SLAVE (to be master)
STOP SLAVE;
RESET MASTER;

-- (2a) OTHER SLAVES (not to be master)
STOP SLAVE;

CHANGE master to
MASTER_HOST='85.215.83.36', -- IP of the new master
MASTER_USER='replicator',
MASTER_PASSWORD='wzudf_19646_HCSI';

-- (3) SLAVE(S)
START SLAVE


-- ===================================================================
-- If MASTER bocomes available again: Switch it to SLAVE

-- (1) MASTER
CHANGE master to
MASTER_HOST='85.215.83.36', -- IP of the new master
MASTER_USER='replicator',
MASTER_PASSWORD='wzudf_19646_HCSI';

-- ===================================================================
-- To make MASTER a MASTER again:

-- (1) MASTER
RESET MASTER

-- (2) SLAVES
STOP SLAVE;

CHANGE master to
MASTER_HOST='85.215.83.36', -- IP of the new master
MASTER_USER='replicator',
MASTER_PASSWORD='wzudf_19646_HCSI';

-- For GROUP replication, see:
-- https://www.digitalocean.com/community/tutorials/how-to-configure-mysql-group-replication-on-ubuntu-16-04
-- https://mysqlhighavailability.com/mysql-group-replication-a-quick-start-guide/

