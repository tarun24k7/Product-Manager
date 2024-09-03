public with sharing class ProductFamilyController {
    @AuraEnabled(cacheable=true)
    public static List<String> getProductFamilies() {
        List<AggregateResult> groupedResults = [SELECT Family FROM Product2 WHERE Family != null GROUP BY Family];
        List<String> families = new List<String>();

        for (AggregateResult ar : groupedResults) {
            families.add((String)ar.get('Family'));
        }

        return families;
    }

    @AuraEnabled(cacheable=false)
    public static List<Product2> getProductsByFamily(String family) {
        return [SELECT Id, Name, Description FROM Product2 WHERE Family = :family];
    }

    @AuraEnabled(cacheable=false)
    public static Product2 getProductDetails(String productId) {
        return [SELECT Id, Name, Description, Family,Price__c FROM Product2 WHERE Id = :productId LIMIT 1];
    }
}
