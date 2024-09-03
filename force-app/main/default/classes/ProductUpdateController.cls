public without sharing class ProductUpdateController {
    
    @AuraEnabled
    public static String updateProduct(String productId, String name, String description, String family, Decimal price) {
        try {
            Product2 product = [SELECT Id, Name, Description, Family, Price__c FROM Product2 WHERE Id = :productId LIMIT 1];
            
            if (name != null) {
                product.Name = name;
            }
            if (description != null) {
                product.Description = description;
            }
            if (family != null) {
                product.Family = family;
            }
            if (price != null) {
                product.Price__c = price;
            }

            update product;

            PricebookEntry productPrice;
            try {
                productPrice = [SELECT Id, Product2Id, Pricebook2Id, UnitPrice FROM PricebookEntry WHERE Product2Id = :product.Id AND Pricebook2Id = '01sO8000001GFH5IAO' LIMIT 1];
            } catch (Exception e) {
                productPrice = null; 
            }

            if (productPrice != null) {
                if (price != null) {
                    productPrice.UnitPrice = price;
                }
                update productPrice;
            } else {
                PricebookEntry newProductPriceEntry = new PricebookEntry();
                newProductPriceEntry.UnitPrice = (price != null) ? price : product.Price__c; 
                newProductPriceEntry.Pricebook2Id = '01sO8000001GFH5IAO'; 
                newProductPriceEntry.Product2Id = product.Id;
                newProductPriceEntry.IsActive = true;
                insert newProductPriceEntry;
            }

            return 'Product updated successfully, including pricebook entry';
        } catch (Exception e) {
            return 'Error updating product: ' + e.getMessage();
        }
    }
    
    @AuraEnabled
    public static String deleteProduct(String productId) {
        try {
            Product2 product = [SELECT Id FROM Product2 WHERE Id = :productId LIMIT 1];
            delete product;
            return 'Product deleted successfully';
        } catch (Exception e) {
            return 'Error deleting product: ' + e.getMessage();
        }
    }

    @AuraEnabled
    public static List<String> getProductFamilies() {
        Schema.DescribeFieldResult fieldResult = Product2.Family.getDescribe();
        List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
        List<String> familyValues = new List<String>();
        for (Schema.PicklistEntry entry : ple) {
            familyValues.add(entry.getLabel());
        }
        return familyValues;
    }

    @AuraEnabled
    public static String createProduct(String name, String description, String family, Decimal price) {
        try {
            Product2 newProduct = new Product2();
            newProduct.Name = name;
            newProduct.Description = description;
            newProduct.Family = family;
            newProduct.Price__c = price;
            insert newProduct;

            PricebookEntry productPrice = new PricebookEntry();
            productPrice.UnitPrice = newProduct.Price__c;
            productPrice.Pricebook2Id = '01sO8000001GFH5IAO'; // Replace with your actual Pricebook2Id
            productPrice.Product2Id = newProduct.Id;
            productPrice.IsActive = true;
            insert productPrice;

            return 'Product and PricebookEntry created successfully';
        } catch (Exception e) {
            return 'Error creating product: ' + e.getMessage();
        }
    }
}
