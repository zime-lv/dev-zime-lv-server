-- (1)
-- Activate SSH access:
-- Plesk -> Websites & Domains -> [Domain] -> Web hosting access -> Access to the server over SSH -> /usr/bin/bash

-- (2)
-- Plesk -> Databases -> Database severs -> click on Host name (localhost) 
--       -> Check option: Allow local MySQL server to accept external connections

-- (2a)
-- Plesk -> Databases -> Database severs -> (select the server) -> click on Toolbox (right side), -- PhpMyAdmin opens
--       -> Click: Replication -> Master replication/click: configure -> Select: Ignore all databases; Replicate:
--       -> Select dev_zimelv and/or zimelv

-- (2b)
-- In /etc/my.cnf.d/server.cnf:
-- [mysqld]
-- server-id=... (use the suggested id)
-- log_bin=mysql-bin
-- log_error=mysql-bin.err
-- binlog_do_db=dev_zimelv
-- innodb_flush_log_at_trx_commit=1
-- sync_binlog=1

-- (2c)
-- In SSH -> Restart DB: systemctl restart mariadb

-- (2d) In PhpMyAdmin:
-- Click: Go

-- (3)
-- Plesk -> Tools & Settings -> Security/Firewall -> MySQL server -> Modify Plesk Firewall rules 
--       -> Allow from selected sources, deny from others -> Add IP address or network: 85.215.83.36 (zime2) or 85.214.146.139 (zime1)
--       -> Apply changes -> Activate

-- (6)
-- On the master:
-- -> Select the DB (dev_zimelv or zimelv)
flush tables with read lock
show master status
-- Write down (probably not necessary):
-- mysql-bin.000002
-- 245
-- dev_zimelv

-- (7)
-- On SSH:
-- mysqldump --user=u501809312753 --password=pmKdzo_732Hg5 dev_zimelv --master-data > dev_zimelv.sql
-- zip -r dev_zimelv.zip dev_zimelv.sql

-- (8)
-- On the master:
unlock tables

-- (9)
-- On SSH:
-- Copy the zip-file to the slave /-directory, then
-- unzip -d / dev_zimelv.zip

-- (14)
-- On master AND slave:
-- -> Select db: dev_zimelv or zimelv
-- -> Create a replicator user:
GRANT REPLICATION SLAVE ON * . * TO 'replicator'@'%'
IDENTIFIED BY 'wzudf_19646_HCSI' WITH MAX_QUERIES_PER_HOUR 0
MAX_CONNECTIONS_PER_HOUR 0 MAX_UPDATES_PER_HOUR 0
MAX_USER_CONNECTIONS 0 ;

-- (10)
-- On the slave, in DB:
STOP SLAVE

-- (11)
-- On the slave:
create database dev_zimelv

-- (12)
-- On SSH:
-- mysql --user=u501809312753 --password=pmKdzo_732Hg5 dev_zimelv < dev_zimelv.sql

-- (13)
-- On SSH restart server: 
-- systemctl restart mariadb
-- -> (not necessary, but nice to have)
-- systemctl status mariadb
-- [Is mysql running?]
-- ps -Af | grep mysqld
-- [Get the listener port:]
-- netstat -lnp | grep mysql

-- (15)
-- On master, show slave hosts:
SHOW SLAVE HOSTS

-- (if necessary)
-- Switching binlog format from STATEMENT to MIXED
-- On the slaves:
STOP SLAVE

-- On the master:
FLUSH TABLES WITH READ LOCK;
FLUSH LOGS;
SET GLOBAL binlog_format = 'MIXED';
FLUSH LOGS;
UNLOCK TABLES;

-- On the slaves:
START SLAVE

-- On both master and slave: systemctl restart mariadb


-- (Apply the CluserIP to the Server and Domain):
-- ClusterIP:
-- 1) Plesk -> Tools & Settings -> IP Addresses -> Click on "Reread IP"
-- 2) Plesk -> Websites & Domains ->  zime.lv -> Web Hosting Access -> IP Address -> Select the CluserIP Address
-- 3) Point the DNS A-Record of the domain name to the CluserIP Address.

-- (Apply the CluserIP to the Server and Domain):
-- ClusterIP:
-- 1) Plesk -> Tools & Settings -> IP Addresses -> Click on "Reread IP"
-- 2) Plesk -> Websites & Domains ->  zime.lv -> Web Hosting Access -> IP Address -> Select the CluserIP Address
-- 3) Point the DNS A-Record of the domain name to the CluserIP Address.

-- (Useful commands)
-- > SSH restart server 
-- systemctl restart mariadb
-- systemctl status mariadb
-- [Is mysql running?]
-- ps -Af | grep mysqld
-- [Get the listener port:]
-- netstat -lnp | grep mysql