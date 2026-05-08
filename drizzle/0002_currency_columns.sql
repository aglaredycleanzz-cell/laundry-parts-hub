-- Add explicit currency columns so cost and selling prices are unambiguous.
-- Cost defaults to USD (Chinese / international suppliers), selling defaults to OMR (Gulf market).
ALTER TABLE `products`
  ADD COLUMN `costCurrency` varchar(3) NOT NULL DEFAULT 'USD',
  ADD COLUMN `sellingCurrency` varchar(3) NOT NULL DEFAULT 'OMR';

ALTER TABLE `pricing_history`
  ADD COLUMN `costCurrency` varchar(3) DEFAULT 'USD',
  ADD COLUMN `sellingCurrency` varchar(3) DEFAULT 'OMR';
