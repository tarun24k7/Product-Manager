import { LightningElement, track, wire } from 'lwc';
import getProductFamilies from '@salesforce/apex/ProductFamilyController.getProductFamilies';
import getProductsByFamily from '@salesforce/apex/ProductFamilyController.getProductsByFamily';
import getProductDetails from '@salesforce/apex/ProductFamilyController.getProductDetails';
import updateProduct from '@salesforce/apex/ProductUpdateController.updateProduct';
import deleteProduct from '@salesforce/apex/ProductUpdateController.deleteProduct';
import createProduct from '@salesforce/apex/ProductUpdateController.createProduct'; 
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ProductManager extends LightningElement {
    @track productFamilies;
    @track products;
    @track selectedCategory='MERCHANDISE';
    @track selectedProduct;
    @track isEditing = false;
    @track showFamily=true;
    @track showProduct=true;
    @track editedProduct = {}; 
    @track showNewProductForm = false; 
    @track newProduct = {}; 
    @track familyOptions = [];
    @track showDeleteModal = false;

    @wire(getProductFamilies)
    wiredProductFamilies({ error, data }) {
        if (data) {
            this.productFamilies = data;

            this.familyOptions = data.map(family => {
                return { label: family, value: family };
            });
        } else if (error) {
            console.error('Error fetching product families:', error);
        }
    }

    handleCategoryClick(event) {
        const selectedCategory = event.target.dataset.family;
        this.selectedCategory=selectedCategory;
        this.selectedProduct=null;
        
        getProductsByFamily({ family: selectedCategory })
            .then(result => {
                this.products = result;

                setTimeout(() => {
                    const productsSection = this.template.querySelector('#productsSection');
                    if (productsSection) {
                        productsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 0); 
            })
            .catch(error => {
                console.error('Error fetching products: ', error);
            });
    }
    handleDeleteClick() {
        this.showDeleteModal = true;
    }

    handleCancelDelete() {
        this.showDeleteModal = false;
    }
    fetchProducts() {
        getProductsByFamily({ family: this.selectedCategory })
            .then(result => {
                this.products = result;
                this.showProduct=true;
            })
            .catch(error => {
                console.error('Error fetching products:', error);
            });
    }

    handleProductClick(event) {
        const productId = event.currentTarget.dataset.id;
        this.fetchProductDetails(productId);
    }

    fetchProductDetails(productId) {
        getProductDetails({ productId })
            .then(result => {
                this.selectedProduct = { ...result }; 
                this.editedProduct = { ...result }; 
                this.products = null; 
            })
            .catch(error => {
                console.error('Error fetching product details:', error);
            });
    }

    handleEditClick() {
        this.isEditing = true;
        this.showNewProductForm = false;

    }

    handleCancelClick() {
        this.isEditing = false;
    }

    handleEditChanges(event) {
        const fieldName = event.target.name; 
        const fieldValue = event.target.value; 
        this.editedProduct[fieldName] = fieldValue; 
    }

    handleSaveClick() {
        updateProduct({
            productId: this.selectedProduct.Id,
            name: this.editedProduct.Name,
            description: this.editedProduct.Description,
            family: this.editedProduct.Family,
            price: parseFloat(this.editedProduct.Price__c)
        })
        .then(result => {
            this.showToast('Success', result, 'success');
            this.isEditing = false;
            this.selectedProduct = null; 
            return this.fetchProductDetails(this.editedProduct.Id);
        })
        .then(updatedProduct => {
            this.selectedProduct = { ...updatedProduct }; 
        })
        .catch(error => {
            this.showToast('Error', 'Failed to update product: ' + error.body.message, 'error');
        });
    }

    handleConfirmDelete() {
        deleteProduct({ productId: this.selectedProduct.Id })
            .then(() => {
                this.showToast('Success', 'Product deleted successfully', 'success');
                this.selectedProduct = null;
                this.fetchProducts(); 
                this.showDeleteModal = false; 
            })
            .catch(error => {
                this.showToast('Error', 'Failed to delete product: ' + error.body.message, 'error');
                this.showDeleteModal = false; 
            });
    }

    handleNewProductClick() {
        this.showNewProductForm = true;
        this.showProduct=false;
        this.showFamily=false;
        this.isEditing=false;
        this.products=false;
        this.newProduct = {}; 
    }

    handleNewProductChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        this.newProduct[fieldName] = fieldValue; 
    }

    handleSaveNewProductClick() {
        createProduct({
            name: this.newProduct.Name,
            description: this.newProduct.Description,
            family: this.newProduct.Family,
            price: parseFloat(this.newProduct.Price__c)
        })
        .then(result => {
            this.showToast('Success', result, 'success');
            this.showNewProductForm = false;
            this.newProduct = {}; 
            this.fetchProducts(); 
        })
        .catch(error => {
            this.showToast('Error', 'Failed to create product: ' + error.body.message, 'error');
        });
    }

    handleCancelNewProductClick() {
        this.showNewProductForm = false;
        this.newProduct = {};
        this.showFamily=true;
        this.fetchProducts(); 
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }

    handleBackClick() {
        this.selectedProduct = null;
        this.isEditing = false;
        this.fetchProducts(); 
    }
}
