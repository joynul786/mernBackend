const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    password: String,
    email: String,

});

// Products Schema
const productSchema = new mongoose.Schema({
    name: String,
    price: String,
    category: String,
    company: String
});




// Creating Models
const userModel = mongoose.model('users', userSchema);
const productsModel = mongoose.model('products', productSchema);

// Exporting Models
module.exports = { userModel, productsModel };
