-- (1)
-- Activate SSH access:
-- Plesk -> Web hosting access -> Access to the server over SSH -> /usr/bin/bash

-- (2)
-- Plesk -> Databases -> Database severs -> click on Host name (localhost) 
--       -> Check option: Allow local MySQL server to accept external connections

-- (3)
-- Plesk -> Tools & Settings -> Security/Firewall -> MySQL server -> Allow incoming from 85.215.83.36

-- (4)
-- In /etc/my.cnf.d/server.cnf:
-- [mysqld]
-- server-id=3788388
-- log_bin=mysql-bin
-- log_error=mysql-bin.err
-- binlog_do_db=dev_zimelv
-- innodb_flush_log_at_trx_commit=1
-- sync_binlog=1

-- (5)
-- > SSH restart server 
-- systemctl restart mariadb
-- systemctl status mariadb

-- (6)
-- On the master:
flush tables with read lock
show master status
-- Write down (probably not necessary):
-- mysql-bin.000005
-- 9949
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

-- (10)
-- On the slave, in DB:
STOP SLAVE

-- (11)
-- On the slave:
create database dev_zimelv

-- (12)
-- On SSH:
-- mysql --user=u501809312753 --password=pmKdzo_732Hg5 zimelv < dev_zimelv.sql

-- (13)
-- On SSH restart server: 
-- systemctl restart mariadb
-- systemctl status mariadb
-- [Is mysql running?]
-- ps -Af | grep mysqld
-- [Get the listener port:]
-- netstat -lnp | grep mysql

-- (14)
-- On master:
-- Create a replicator user:
GRANT REPLICATION SLAVE ON * . * TO 'replicator'@'%'
IDENTIFIED BY 'wzudf_19646_HCSI' WITH MAX_QUERIES_PER_HOUR 0
MAX_CONNECTIONS_PER_HOUR 0 MAX_UPDATES_PER_HOUR 0
MAX_USER_CONNECTIONS 0 ;

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


-- (Apply the CluserIP to the Server and Domain):
-- ClusterIP:
-- 1) Plesk -> Tools & Settings -> IP Addresses -> Click on "Reread IP"
-- 2) Plesk -> Websites & Domains ->  zime.lv -> Web Hosting Access -> IP Address -> Select the CluserIP Address
-- 3) Point the DNS A-Record of the domain name to the CluserIP Address.