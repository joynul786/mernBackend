const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
require('./db/config');
const { userModel, productsModel } = require('./db/schemaModel');

const app = express();
app.use(express.json());
app.use(cors());

const JwtKey = 'dashboard'
let port = 5000

// Register route
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await userModel.findOne({ email })
        if (existingUser) {
            console.log('Email already Used')
            return res.status(400).send('Email already Used')
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({ name, email, password: hashedPassword });
        const saveUser = await newUser.save();
        const userToSend = saveUser.toObject();
        delete userToSend.password;
        jsonwebtoken.sign({ user: userToSend }, JwtKey, { expiresIn: '2h' }, (err, token) => {
            if (err) {
                res.status(500).send({ error: "Token Generate Error " })
            }
            res.send({ user: userToSend, auth: token });

        })

    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
});

// Login route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const findUser = await userModel.findOne({ email });
        if (!findUser) {
            return res.status(404).send('User not found');
        }
        const isMatch = await bcrypt.compare(password, findUser.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }
        const userToSend = findUser.toObject();
        delete userToSend.password;
        jsonwebtoken.sign({ user: userToSend }, JwtKey, { expiresIn: '2h' }, (err, token) => {
            if (err) {
                return res.status(500).send('Token Generate Error')
            }
            res.send({ user: userToSend, auth: token })
        })
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
});

// Add products route
app.post('/addProducts', VerifyToken, async (req, res) => {
    try {
        const { name, price, category, company } = req.body;
        const addProducts = new productsModel({ name, price, category, company });
        const saveData = await addProducts.save();
        console.log(saveData);
        res.send(saveData);
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
});


// List products route
app.get('/print', VerifyToken, async (req, res) => {
    try {
        const findData = await productsModel.find();
        console.log(findData);
        res.send(findData);
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
});

// Delete products route
app.delete('/delete/:id', VerifyToken, async (req, res) => {
    try {
        const deleteProduct = await productsModel.deleteOne({ _id: req.params.id });
        console.log(deleteProduct);
        if (deleteProduct.deletedCount === 1) {
            res.status(200).send('Product deleted successfully');
        } else {
            res.status(404).send('Product not found');
        }
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
});

// Update products
// Prefill data
app.get('/prefill/:id', VerifyToken, async (req, res) => {
    try {
        const findData = await productsModel.findOne({ _id: req.params.id });
        console.log(findData);
        res.send(findData);
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
});
// Update data
app.put('/update/:id', VerifyToken, async (req, res) => {
    try {
        const updateData = await productsModel.updateOne(
            { _id: req.params.id },
            { $set: req.body }
        );
        console.log(updateData);
        res.send(updateData);
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
});

// Search items
app.get('/search/:key', VerifyToken, async (req, res) => {
    try {
        const searchTerm = req.params.key.toLowerCase();
        const results = await productsModel.find({
            "$or": [
                { "name": { $regex: searchTerm, $options: 'i' } },
                { "price": { $regex: searchTerm, $options: 'i' } },
                { "category": { $regex: searchTerm, $options: 'i' } },
                { "company": { $regex: searchTerm, $options: 'i' } },
            ]
        });
        console.log(results);
        res.send(results);
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
});

function VerifyToken(req, res, next) {
    let token = req.headers['authorization']
    if (token) {
        token = token.split(' ')[1]
        // console.log("split", token)
        jsonwebtoken.verify(token, JwtKey, (err, valid) => {
            if (err) {
                return res.status(401).send({ result: 'Invalid token' });
            }
            else {
                console.log("Token is valid", token)
                next()
            }
        })
    } else {
        return res.status(401).send({ result: 'Token required' });
    }
}

app.listen(port, () => {
    console.log('Server is running on port ' + port);
});
