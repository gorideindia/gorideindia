require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const multer = require("multer");
const Razorpay = require("razorpay");
const path = require("path");

const app = express();

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "goride_secret_key",
    resave: false,
    saveUninitialized: false
}));

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

console.log("GoRide Server Started");
console.log("KEY :", process.env.RAZORPAY_KEY_ID);
const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, "images/");
    },

    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }

});

const upload = multer({ storage });

const db = mysql.createConnection({

    host: "localhost",
    user: "root",
    password: "pass@12345",
    database: "goride"

});

db.connect((err) => {

    if (err) {

        console.log(err);

    } else {

        console.log("✅ MySQL Connected");

    }

});
app.get("/", (req, res) => {

    res.sendFile(path.join(__dirname, "index.html"));

});

app.get("/test", (req, res) => {

    res.send("TEST OK");

});

app.get("/cars", (req, res) => {

    db.query(
        "SELECT * FROM cars",
        (err, result) => {

            if (err) {

                return res.status(500).json(err);

            }

            res.json(result);

        }
    );

});
// =====================
// CREATE ORDER
// =====================

app.post("/create-order", async (req, res) => {

    try {

        const { amount } = req.body;

        const order = await razorpay.orders.create({

            amount: amount * 100,
            currency: "INR",
            receipt: "goride_" + Date.now()

        });

        res.json({

            success: true,
            order: order

        });

    } catch (err) {

        console.log(err);

        res.json({

            success: false,
            message: "Order Failed"

        });

    }

});// =====================
// SAVE BOOKING
// =====================

app.post("/booking", (req, res) => {

    const {

        customer_name,
        mobile,
        car_name,
        pickup_date,
        return_date,
        total_price,
        payment_id,
        order_id,
        payment_status

    } = req.body;const sql = `
INSERT INTO bookings
(
customer_name,
mobile,
car_name,
pickup_date,
return_date,
total_price,
payment_id,
order_id,
payment_status,
status
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

db.query(
    sql,
    [
        customer_name,
        mobile,
        car_name,
        pickup_date,
        return_date,
        total_price,
        payment_id,
        order_id,
        payment_status,
        "Booked"
    ],
    (err, result) => {

        if (err) {
            console.log(err);
            return res.send("Booking Failed");
        }

        res.send("Booking Saved Successfully");
    }
);

});
// ======================
// START SERVER
// ======================

app.listen(3000, () => {
    console.log("GoRide Server Started on http://localhost:3000");
});
