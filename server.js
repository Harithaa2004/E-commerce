require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3333;
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key123";
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://harithaa:harithaa120323@selltools.fsw8m.mongodb.net/?retryWrites=true&w=majority&appName=selltools";
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));
const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    date: {
        type: Date,
        default: Date.now
    }
});

const Contact = mongoose.model("Contact", contactSchema);
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }
});

const User = mongoose.model("User", userSchema);

app.use(cors({ origin: "*" }));  // Place before defining routes

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

// Serve homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "ecommerce.html"));
});

app.post("/signup", async (req, res) => {
    try {
        console.log("📩 Signup Request Body:", req.body);

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required!" });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(400).json({ error: "User already exists!" });
        }
        

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email: email.toLowerCase(),
            password: hashedPassword
        });

        await newUser.save();

        res.json({ message: "Signup successful! Please log in." ,redirect:"auth.html"
        });
    } catch (error) {
        console.error("❌ Signup Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Login
app.post("/auth", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("📩 Login Request:", email);

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log("❌ User Not Found");
            return res.status(401).json({ message: "Invalid email or password!" });
        }

        console.log("✅ User Found:", user);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("❌ Password Mismatch");
            return res.status(401).json({ message: "Invalid email or password!" });
        }

        const token = jwt.sign({ email: user.email, isAdmin: user.isAdmin }, SECRET_KEY, { expiresIn: "7d" });
        console.log("🔑 Token Generated:", token);

        res.json({ message: "Login successful!", token, role: user.isAdmin ? "admin" : "user" });
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/verify", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            console.log("❌ Token Verification Failed:", err.message);
            return res.status(403).json({ error: "Invalid token" });
        }

        console.log("✅ Token Verified:", decoded);
        res.json({ role: decoded.isAdmin ? "admin" : "user" });
    });
});

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(403).json({ error: "Access Denied!" });
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid Token!" });
    }
};
const verifyAdmin = (req, res, next) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Access Denied! Admins only." });
    next();
};

app.post("/promote", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found!" });
        
        if (user.isAdmin) return res.status(400).json({ message: "User is already an admin!" });
        
        user.isAdmin = true;
        await user.save();
        res.json({ message: "User promoted to admin successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/admin", verifyToken, verifyAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});
const productSchema = new mongoose.Schema({
    category: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageURL: { type: String, required: true },
    stock:{type: Number,required:true}
});

const Product = mongoose.model("Product", productSchema);
app.post('/add-products', verifyToken, verifyAdmin, async (req, res) => {
    const { category, name, price, imageURL, stock } = req.body;

    if (!category || !name || !price || !imageURL || stock === "" || stock === undefined || stock === null) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const newProduct = new Product({
            category,
            name,
            price,
            imageURL,
            stock: parseInt(stock)
        });

        await newProduct.save();
        res.status(201).json({ message: 'Product added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
app.get("/products", async (req, res) => {
    try {
        const category = req.query.category;
        console.log("🔍 Category Filter:", category);

        const query = category ? { category } : {};
        const products = await Product.find(query);

        console.log("📦 Fetched Products:", products);
        res.json(products);
    } catch (error) {

        
        console.error("❌ Error fetching products:", error);
        res.status(500).json({ error: "Server error" });
    }
});
app.delete("/delete-product/:id", async (req, res) => {
    try {
        const productId = req.params.id;
        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ error: "Product not found!" });
        }

        res.json({ message: "✅ Product deleted successfully!", productId });
    } catch (error) {
        console.error("❌ Error deleting product:", error);
        res.status(500).json({ error: "Server error" });
    }
});
app.put("/update-product/:id", async (req, res) => {
    const { id } = req.params;
    const { name, price, category, imageURL,stock } = req.body;

    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { name, price, category, imageURL,stock },
            { new: true } // This ensures the updated product is returned
        );

        if (!updatedProduct) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.get("/products/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "Product not found!" });
        }
        res.json(product);
    } catch (error) {
        console.error("❌ Error fetching product:", error);
        res.status(500).json({ error: "Server error" });
    }
});
app.listen(PORT, () => {
    console.log(`✅ Server running at http://127.0.0.1:${PORT}/`);
});

app.post("/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const newContact = new Contact({ name, email, message });
        await newContact.save();

        res.status(200).json({ message: "Contact saved successfully!" });
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});