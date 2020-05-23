--
-- Vault
--
CREATE TABLE IF NOT EXISTS vault (
    `acc` decimal(14,2) unsigned NOT NULL DEFAULT 0  COMMENT "local currency supply account",
    `status` int(1) NOT NULL DEFAULT 0  COMMENT "account status",
    `created` datetime NULL  COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "workplace",
    `ts` timestamp NOT NULL  COMMENT "timestamp"
) ENGINE = InnoDB COMMENT = 'vault';
INSERT INTO vault (acc, created, reviser, workplace)
VALUES (100000000000, UTC_TIMESTAMP(), 'SYS', 'SYSTEM');

--
-- Currencies
--
CREATE TABLE IF NOT EXISTS currencies (
    `id` int(11) unsigned NOT NULL auto_increment COMMENT "primary key",
    `name` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT "currency name",
    `abbr` varchar(5) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT "currency abbreviation",
    `rate` decimal(6,5) unsigned NULL DEFAULT 1 COMMENT "currency exchange rate",
    `region` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT "currency region",
    `status` int(1) NOT NULL DEFAULT 0  COMMENT "status",
    `created` datetime NULL COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "workplace",
    `ts` timestamp NOT NULL COMMENT "timestamp",
    PRIMARY KEY (`id`),
    UNIQUE KEY unique_name (`name`),
    UNIQUE KEY unique_abbr (`abbr`),
    INDEX `index_abbr` (`abbr`) USING BTREE
) ENGINE = InnoDB COMMENT = 'currencies';
INSERT INTO `currencies` (`name`, `abbr`, `rate`, `region`, `status`, `reviser`, `workplace`) 
VALUES ('Zīme', 'Z', 1, '*', 0, 'SYSTEM', 'SYSTEM');

--
-- Users
--
CREATE TABLE IF NOT EXISTS users (
    `id` int(11) unsigned NOT NULL auto_increment COMMENT "primary key",
    `uid` varchar(24) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "unique user id",
    `firstname` varchar(127) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "first name",
    `lastname` varchar(127) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "last name",
    `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "email",
    `pw` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "password",

    `sequence` int(2) NULL COMMENT "user sequence per timezone per day",
    `birthdate` date NULL COMMENT "user date of birth",
    `timezone` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "user timezone at birth",

    `website` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "website",
    `phone` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "phone",

    `acc_curr` decimal(7,2) unsigned NOT NULL DEFAULT 0  COMMENT "current account",
    `acc_cred` decimal(6,2) unsigned NOT NULL DEFAULT 0  COMMENT "credit account",
    `acc_save` decimal(7,2) unsigned NOT NULL DEFAULT 0  COMMENT "savings account",
    `allowance_date` date NULL COMMENT "allowance date",

    `currency_id` varchar(5) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'Z' COMMENT "currency abbreviation fid",
    `language` varchar(2) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "language code",
    `access` int(4) NULL COMMENT "access rights",
    `last_seen` datetime NULL COMMENT "user last activity date and time",
    `status` int(1) NOT NULL DEFAULT 0  COMMENT "status: 0 = not verified, 1 = verified, 2 = suspended, 3 = deleted",
    `created` datetime NULL  COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "workplace",
    `ts` timestamp NOT NULL  COMMENT "timestamp",
    PRIMARY KEY (`id`),
    FOREIGN KEY(`currency_id`) REFERENCES currencies(`abbr`),
    UNIQUE KEY unique_uid (`uid`),
    UNIQUE KEY unique_email (`email`),
    INDEX `index_uid` (`uid`) USING BTREE
) ENGINE = InnoDB COMMENT = 'users';

--
-- Pools
--
CREATE TABLE IF NOT EXISTS pools (
    `id` int(11) unsigned NOT NULL auto_increment COMMENT "primary key",
    `pool_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "pool id",
    `title` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "pool title",
    `description` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "pool description",
    `link` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "link to the pool webpage",
    `image` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "path to the pool image",
    `status` int(1) NOT NULL DEFAULT 0  COMMENT "status",
    `created` datetime NULL  COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "workplace",
    `ts` timestamp NOT NULL  COMMENT "timestamp",
    PRIMARY KEY (`id`),
    UNIQUE KEY unique_pool (`pool_id`),
    INDEX `index_pool` (`pool_id`) USING BTREE
) ENGINE = InnoDB COMMENT = 'user pools';

--
-- Pool users
--
CREATE TABLE IF NOT EXISTS pool_users (
    `id` int(11) unsigned NOT NULL auto_increment COMMENT "primary key",
    `title` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "pool title",
    `description` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "pool description",
    `pool_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "foreign key to pool id",
    `user_id` varchar(24) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "pool user id",
    `status` int(1) NOT NULL DEFAULT 0  COMMENT "status",
    `created` datetime NULL  COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "workplace",
    `ts` timestamp NOT NULL  COMMENT "timestamp",
    PRIMARY KEY (`id`),
    UNIQUE KEY unique_pool_users (`pool_id`, `user_id`),
    FOREIGN KEY(`pool_id`) REFERENCES pools(`pool_id`),
    FOREIGN KEY(`user_id`) REFERENCES users(`uid`),
    INDEX `index_pool_users` (`pool_id`, `user_id`) USING BTREE
) ENGINE = InnoDB COMMENT = 'pool users';

--
-- Businesses
--
CREATE TABLE IF NOT EXISTS businesses (
    `id` int(11) unsigned NOT NULL auto_increment COMMENT "primary key",
    `owner_id` varchar(24) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "owner id",
    `business_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "business ID",
    `title` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "business title",
    `description` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "business description",
    `link` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "link to the company webpage",
    `image` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "path to the company logo",
    `status` int(1) NOT NULL DEFAULT 0  COMMENT "status",
    `created` datetime NULL  COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "workplace",
    `ts` timestamp NOT NULL  COMMENT "timestamp",
    PRIMARY KEY (`id`),
    UNIQUE KEY unique_business (`business_id`),
    UNIQUE KEY unique_owner_title (`owner_id`, `title`),
    FOREIGN KEY(`owner_id`) REFERENCES users(`uid`),
    INDEX `index_business` (`business_id`)
) ENGINE = InnoDB COMMENT = 'businesses';

--
-- Purposes
--
CREATE TABLE IF NOT EXISTS purposes (
    `id` int(11) unsigned NOT NULL auto_increment COMMENT "primary key",
    `business_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "foreign key to business ID",
    `purpose_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "purpose id",
    `title` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "purpose title",
    `description` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "purpose description",
    `status` int(1) NOT NULL DEFAULT 0  COMMENT "status",
    `created` datetime NULL  COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "workplace",
    `ts` timestamp NOT NULL  COMMENT "timestamp",
    PRIMARY KEY (`id`),
    UNIQUE KEY unique_purpose (`purpose_id`),
    UNIQUE KEY unique_purpose_id (`title`, `description`),
    FOREIGN KEY(`business_id`) REFERENCES businesses(`business_id`),
    INDEX `index_purpose` (`purpose_id`)
) ENGINE = InnoDB COMMENT = 'purposes';


--
-- Purpose properties
--
CREATE TABLE IF NOT EXISTS purpose_props (
    `id` int(11) unsigned NOT NULL auto_increment COMMENT "primary key",
    `purpose_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "purpose id",
    `language` varchar(2) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "language code",
    `title` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "purpose title",
    `description` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "purpose description",
    `link` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "link to the product webpage",
    `image` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "path to the product logo",
    `status` int(1) NOT NULL DEFAULT 0  COMMENT "status",
    `created` datetime NULL  COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "workplace",
    `ts` timestamp NOT NULL  COMMENT "timestamp",
    PRIMARY KEY (`id`),
    UNIQUE KEY unique_purpose_language (`purpose_id`, `language`),
    FOREIGN KEY(`purpose_id`) REFERENCES purposes(`purpose_id`),
    INDEX `index_purpose` (`purpose_id`, `language`)
) ENGINE = InnoDB COMMENT = 'purpose_props';

--
-- Shares
--
CREATE TABLE IF NOT EXISTS shares (
    `id` int(11) unsigned NOT NULL auto_increment COMMENT "primary key",
    `purpose_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "foreign key to purpose id",
    `shareholder_id` varchar(24) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "shareholder id",
    `title` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "purpose title",
    `description` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "share description",
    `roles` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "shareholder roles",
    `share` int(2) unsigned NOT NULL DEFAULT 0  COMMENT "user share",
    `status` int(1) NOT NULL DEFAULT 0  COMMENT "status",
    `created` datetime NULL  COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "workplace",
    `ts` timestamp NOT NULL  COMMENT "timestamp",
    PRIMARY KEY (`id`),
    UNIQUE KEY unique_share (`purpose_id`, `shareholder_id`),
    FOREIGN KEY(`purpose_id`) REFERENCES purposes(`purpose_id`),
    FOREIGN KEY(`shareholder_id`) REFERENCES users(`uid`),
    INDEX `index_shares` (`purpose_id`, `shareholder_id`) USING BTREE
) ENGINE = InnoDB COMMENT = 'shares';

--
-- Currency managers
--
CREATE TABLE IF NOT EXISTS currency_sponsors (
    `id` int(11) unsigned NOT NULL auto_increment COMMENT "primary key",
    `sponsor_id` varchar(24) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "currency admin id",
    `abbr` varchar(5) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT "currency abbreviation fid",
    `rate` decimal(6,5) unsigned NULL DEFAULT 1 COMMENT "suggested currency exchange rate",
    `influence` int(2) unsigned NOT NULL DEFAULT 1  COMMENT "admin influence share",
    `status` int(1) NOT NULL DEFAULT 0  COMMENT "status",
    `created` datetime NULL COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "workplace",
    `ts` timestamp NOT NULL COMMENT "timestamp",
    PRIMARY KEY (`id`),
    FOREIGN KEY(`sponsor_id`) REFERENCES users(`uid`),
    FOREIGN KEY(`abbr`) REFERENCES currencies(`abbr`),
    UNIQUE KEY unique_admin (`sponsor_id`, `abbr`),
    INDEX `index_abbr` (`abbr`) USING BTREE
) ENGINE = InnoDB COMMENT = 'currency_managers';

--
-- Transactions
--
CREATE TABLE IF NOT EXISTS transactions (
    `transaction_id` int(11) unsigned NOT NULL auto_increment COMMENT "primary key",
    `type` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT "transaction type",
    `amount` decimal(7,2) unsigned NOT NULL DEFAULT 0  COMMENT "transaction value",
    `currency` varchar(5) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT "currency abbreviation fid",
    `exchange_rate` decimal(6,5) unsigned NULL DEFAULT 1 COMMENT "currency exchange rate",
    `sender_id` varchar(24) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "foreign key to user id",
    `purpose_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "foreign key to purpose id",
    `sender_pool_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "foreign key to pool id",
    `comment` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "comment",
    `status` int(1) NOT NULL DEFAULT 0  COMMENT "status",
    `created` datetime NULL  COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "workplace",
    `ts` timestamp NOT NULL  COMMENT "timestamp",
    PRIMARY KEY (`transaction_id`),
    FOREIGN KEY(`currency`) REFERENCES currencies(`abbr`),
    FOREIGN KEY(`sender_id`) REFERENCES users(`uid`),
    FOREIGN KEY(`purpose_id`) REFERENCES purposes(`purpose_id`),
    FOREIGN KEY(`sender_pool_id`) REFERENCES pools(`pool_id`),
    INDEX `index_type` (`type`),
    INDEX `index_sender` (`sender_id`),
    INDEX `index_purpose` (`purpose_id`),
    INDEX `index_sender_pool` (`sender_pool_id`)
) ENGINE = InnoDB COMMENT = 'transactions';

--
-- Transaction positions
--
CREATE TABLE IF NOT EXISTS transaction_positions (
    `id` int(11) unsigned NOT NULL auto_increment COMMENT "primary key",
    `transaction_id` int(11) unsigned NOT NULL COMMENT "foreign key to user id",
    `amount` decimal(7,2) unsigned NOT NULL DEFAULT 0  COMMENT "transaction position value",
    `recipient_id` varchar(24) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "foreign key to user id",
    `recipient_pool_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "foreign key to pool id",
    `roles` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "shareholder current roles",
    `share` int(2) unsigned NULL COMMENT "user current share",
    `share_per_cent` decimal(6,2) unsigned NULL COMMENT "user current share in per cent",
    `from_account` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "source account name",
    `to_account` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "target account name",
    `status` int(1) NOT NULL DEFAULT 0  COMMENT "status",
    `created` datetime NULL  COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "workplace",
    `ts` timestamp NOT NULL  COMMENT "timestamp",
    PRIMARY KEY (`id`),
    FOREIGN KEY(`transaction_id`) REFERENCES transactions(`transaction_id`),
    FOREIGN KEY(`recipient_id`) REFERENCES users(`uid`),
    FOREIGN KEY(`recipient_pool_id`) REFERENCES pools(`pool_id`),
    INDEX `index_recipient` (`recipient_id`),
    INDEX `index_recipient_pool` (`recipient_pool_id`)
) ENGINE = InnoDB COMMENT = 'transaction_positions';

--
-- Validation tokens
--
CREATE TABLE IF NOT EXISTS validation_tokens (
    `id` int(11) unsigned NOT NULL auto_increment COMMENT "primary key",
    `type` varchar(12) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "token type",
    `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "email",
    `token` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "validation token",
    `expiration` datetime NULL COMMENT "expiration date and time",
    `resent` int(1) NOT NULL DEFAULT 0 COMMENT "times resent",
    `status` int(1) NOT NULL DEFAULT 0 COMMENT "token used status",
    `created` datetime NULL  COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "workplace",
    `ts` timestamp NOT NULL  COMMENT "timestamp",
    PRIMARY KEY (`id`),
    FOREIGN KEY(`email`) REFERENCES users(`email`) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY unique_email (`type`, `email`),
    UNIQUE KEY unique_user_token (`type`, `email`, `token`),
    INDEX `index_email` (`email`),
    INDEX `index_token` (`token`)
) ENGINE = InnoDB COMMENT = 'validation_tokens';

--
-- TANs
--
CREATE TABLE IF NOT EXISTS tans (
    `id` int(11) unsigned NOT NULL auto_increment COMMENT "primary key",
    `type` varchar(12) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "TAN type",
    `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "email",
    `tan` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "TAN",
    `expiration` datetime NULL COMMENT "expiration date and time",
    `resent` int(1) NOT NULL DEFAULT 0 COMMENT "times resent",
    `status` int(1) NOT NULL DEFAULT 0 COMMENT "TAN used status",
    `created` datetime NULL  COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "workplace",
    `ts` timestamp NOT NULL  COMMENT "timestamp",
    PRIMARY KEY (`id`),
    FOREIGN KEY(`email`) REFERENCES users(`email`) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY unique_email (`type`, `email`),
    UNIQUE KEY unique_user_tan (`type`, `email`, `tan`),
    INDEX `index_email` (`email`),
    INDEX `index_tan` (`tan`)
) ENGINE = InnoDB COMMENT = 'tans';

--
-- Carts
--
CREATE TABLE IF NOT EXISTS carts (
    `id` int(11) unsigned NOT NULL auto_increment COMMENT "primary key",
    `type` varchar(12) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "cart type",
    `cartid` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "cart id",
    `content` TEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "cart content (JSON string)",
    `expiration` datetime NULL COMMENT "cart expiration date and time",
    `merchant` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "merchants business ID",
    `customer` varchar(24) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "user id",
    `status` int(1) NOT NULL DEFAULT 0 COMMENT "cart status",
    `created` datetime NULL  COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "workplace",
    `ts` timestamp NOT NULL  COMMENT "timestamp",
    PRIMARY KEY (`id`),
    FOREIGN KEY(`merchant`) REFERENCES businesses(`business_id`),
    FOREIGN KEY(`customer`) REFERENCES users(`uid`),
    UNIQUE KEY unique_cart (`cartid`),
    INDEX `index_cartid` (`cartid`),
    INDEX `index_customer` (`customer`)
) ENGINE = InnoDB COMMENT = 'carts';

--
-- User connection
--
CREATE TABLE IF NOT EXISTS user_connection (
    `id` int(11) unsigned NOT NULL auto_increment COMMENT "primary key",
    `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "user email",
    `date` date NULL COMMENT "allowance date",
    `ip` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "user ip address",
    `connections` int(4) NOT NULL DEFAULT 0 COMMENT "# of ip connections",
    `country` varchar(2) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "2 letter ISO-3166-1 country code",
    `region` varchar(3) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "up to 3 alphanumeric variable length characters as ISO 3166-2 code",
    `eu` int(1) NULL COMMENT "1 if the country is a member state of the European Union, 0 otherwise.",
    `timezone` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "timezone from IANA Time Zone Databases",
    `city` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT "the full city name",
    `gps_lat` decimal(10,8) NULL COMMENT "the latitude of the city",
    `gps_lon` decimal(11,8) NULL COMMENT "the longitude of the city",
    `metro` int(3) NULL COMMENT "metro code",
    `area` int(2) NULL COMMENT "the approximate accuracy radius (km), around the latitude and longitude",
    `status` int(1) NOT NULL DEFAULT 0 COMMENT "connection location status; 0 = not user approved, 1 = user approved",
    `created` datetime NULL  COMMENT "creation date and time",
    `reviser` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "reviser",
    `workplace` varchar(36) CHARACTER SET utf8 COLLATE utf8_general_ci NULL  COMMENT "workplace",
    `ts` timestamp NOT NULL  COMMENT "timestamp",
    PRIMARY KEY (`id`),
    FOREIGN KEY(`email`) REFERENCES users(`email`) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY unique_user_connection (`email`, `timezone`, `city`, `area`),
    INDEX `index_email` (`email`)
) ENGINE = InnoDB COMMENT = 'user_connection';

--
-- Trigger, creates Business ID, 20 chars long
--
CREATE TRIGGER ins_business_id 
BEFORE INSERT ON businesses FOR EACH ROW 
SET NEW.business_id = CONCAT(
    'B001', LPAD(
        CONV(
            SUBSTRING(
                SHA1(
                    CONCAT('seed202004131200','-', NEW.title,'-', NEW.description)
                ), 1, 15
            ), 16, 10
        ), 16, '0'
    )
);

--
-- Trigger, creates Purpose ID, 24 chars long
--
CREATE TRIGGER ins_purpose_id 
BEFORE INSERT ON purposes FOR EACH ROW 
SET NEW.purpose_id = CONCAT(
    'P001', LPAD(
        CONV(
            SUBSTRING(
                SHA1(
                    CONCAT('seed202004131313','-', NEW.title,'-', NEW.description)
                ), 1, 15
            ), 16, 10
        ), 20, '0'
    )
);
