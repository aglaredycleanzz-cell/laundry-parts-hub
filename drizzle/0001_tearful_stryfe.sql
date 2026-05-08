CREATE TABLE `ai_agent_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentType` enum('sourcing','outreach','support','analytics') NOT NULL,
	`taskType` varchar(100) NOT NULL,
	`status` enum('pending','running','completed','failed') DEFAULT 'pending',
	`input` json,
	`output` json,
	`error` text,
	`executedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_agent_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`userId` int,
	`customerId` int,
	`productId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communication_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`type` enum('email','whatsapp','linkedin','facebook','instagram','phone','in_app') NOT NULL,
	`direction` enum('outbound','inbound') NOT NULL,
	`subject` varchar(255),
	`message` text,
	`status` enum('sent','delivered','read','replied','failed') DEFAULT 'sent',
	`agentType` enum('outreach_agent','support_agent','manual') DEFAULT 'manual',
	`responseTime` int,
	`sentiment` enum('positive','neutral','negative'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communication_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('hotel','hospital','laundry','maintenance_manager','other') NOT NULL,
	`contactPerson` varchar(255),
	`email` varchar(320),
	`phone` varchar(20),
	`whatsapp` varchar(20),
	`address` text,
	`city` varchar(100),
	`country` varchar(100),
	`engagementScore` decimal(3,2) DEFAULT '0',
	`lastContactDate` timestamp,
	`communicationChannel` enum('email','whatsapp','linkedin','phone','other'),
	`notes` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `image_recognition_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`imageUrl` varchar(500) NOT NULL,
	`recognizedParts` json,
	`confidence` decimal(3,2),
	`uploadedBy` int,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `image_recognition_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`lastRestockDate` timestamp,
	`reorderStatus` enum('in_stock','low_stock','out_of_stock','on_order') DEFAULT 'in_stock',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('quotation_request','low_inventory','high_profit_opportunity','customer_engagement','supplier_price_update','order_status_update','agent_alert') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`relatedEntityType` varchar(50),
	`relatedEntityId` int,
	`isRead` boolean DEFAULT false,
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`channels` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`customerId` int NOT NULL,
	`quotationId` int,
	`status` enum('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
	`items` json,
	`totalAmount` decimal(12,2),
	`paymentStatus` enum('pending','partial','paid','overdue') DEFAULT 'pending',
	`deliveryDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `pricing_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`supplierId` int,
	`costPrice` decimal(12,2),
	`sellingPrice` decimal(12,2),
	`profitMargin` decimal(5,2),
	`changeReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pricing_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('machinery','spare_parts') NOT NULL,
	`type` varchar(100),
	`specifications` json,
	`costPrice` decimal(12,2) NOT NULL,
	`sellingPrice` decimal(12,2) NOT NULL,
	`profitMargin` decimal(5,2),
	`supplierId` int,
	`supplierSku` varchar(100),
	`currentStock` int DEFAULT 0,
	`reorderPoint` int DEFAULT 10,
	`imageUrl` varchar(500),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `quotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quotationNumber` varchar(50) NOT NULL,
	`customerId` int NOT NULL,
	`status` enum('draft','sent','viewed','accepted','rejected','expired') DEFAULT 'draft',
	`items` json,
	`totalAmount` decimal(12,2),
	`currency` varchar(3) DEFAULT 'OMR',
	`validUntil` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`sentAt` timestamp,
	`viewedAt` timestamp,
	CONSTRAINT `quotations_id` PRIMARY KEY(`id`),
	CONSTRAINT `quotations_quotationNumber_unique` UNIQUE(`quotationNumber`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`country` varchar(100),
	`website` varchar(500),
	`contactPerson` varchar(255),
	`email` varchar(320),
	`phone` varchar(20),
	`whatsapp` varchar(20),
	`minimumOrderQuantity` int DEFAULT 1,
	`leadTime` int,
	`reliabilityScore` decimal(3,2),
	`lastPriceUpdate` timestamp,
	`notes` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `task_agent_idx` ON `ai_agent_tasks` (`agentType`);--> statement-breakpoint
CREATE INDEX `task_status_idx` ON `ai_agent_tasks` (`status`);--> statement-breakpoint
CREATE INDEX `event_type_idx` ON `analytics_events` (`eventType`);--> statement-breakpoint
CREATE INDEX `event_user_idx` ON `analytics_events` (`userId`);--> statement-breakpoint
CREATE INDEX `comm_customer_idx` ON `communication_log` (`customerId`);--> statement-breakpoint
CREATE INDEX `comm_type_idx` ON `communication_log` (`type`);--> statement-breakpoint
CREATE INDEX `customer_name_idx` ON `customers` (`name`);--> statement-breakpoint
CREATE INDEX `customer_type_idx` ON `customers` (`type`);--> statement-breakpoint
CREATE INDEX `customer_email_idx` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `image_url_idx` ON `image_recognition_cache` (`imageUrl`);--> statement-breakpoint
CREATE INDEX `inventory_product_idx` ON `inventory` (`productId`);--> statement-breakpoint
CREATE INDEX `notif_user_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notif_type_idx` ON `notifications` (`type`);--> statement-breakpoint
CREATE INDEX `order_customer_idx` ON `orders` (`customerId`);--> statement-breakpoint
CREATE INDEX `order_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `pricing_product_idx` ON `pricing_history` (`productId`);--> statement-breakpoint
CREATE INDEX `sku_idx` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `supplier_idx` ON `products` (`supplierId`);--> statement-breakpoint
CREATE INDEX `quotation_customer_idx` ON `quotations` (`customerId`);--> statement-breakpoint
CREATE INDEX `quotation_status_idx` ON `quotations` (`status`);--> statement-breakpoint
CREATE INDEX `supplier_name_idx` ON `suppliers` (`name`);