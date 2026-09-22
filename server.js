const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const path = require("path");
const PDFDocument = require("pdfkit");

const app = express();let razorpay = null;
let db = null;
// =========================
// MYSQL CONNECTION
// =========================

if (
    process.env.DB_HOST &&
    process.env.DB_USER &&
    process.env.DB_NAME
) {
    db = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT || 3306),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    });

    db.getConnection((err, connection) => {
        if (err) {
            console.log("MySQL Connection Error:", err.message);
        } else {
            console.log("MySQL Connected Successfully");
            connection.release();
        }
    });
} else {
    console.log("MySQL environment variables not configured");
}

if (
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET
) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    console.log("Razorpay Ready");
} else {
    console.log("Razorpay keys not found");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    cors({
        origin: true,
        credentials: true
    })
);
app.use(express.static(__dirname));
// ================================
// IMAGE UPLOAD SETUP
// ================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "images");
    },

    filename: function (req, file, cb) {
        const uniqueName =
            Date.now() + "-" + file.originalname;

        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage
});

app.use(
    session({
        secret: process.env.SESSION_SECRET || "goride_secret_key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);
// =========================
// REGISTER - BCRYPT
// =========================

app.post("/register", async (req, res) => {

    if (!db) {
        return res.status(500).json({
            success: false,
            message: "Database not configured"
        });
    }

    const { name, phone, email, password } = req.body;

    if (!name || !phone || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please fill all fields"
        });
    }

    try {

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users
            (name, phone, email, password)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [name, phone, email, hashedPassword],
            (err, result) => {

                if (err) {
                    console.log("Register Error:", err.message);

                    return res.status(500).json({
                        success: false,
                        message: "Registration Failed"
                    });
                }

                res.json({
                    success: true,
                    message: "Registration Successful"
                });
            }
        );

    } catch (err) {

        console.log("Register Error:", err);

        res.status(500).json({
            success: false,
            message: "Registration Server Error"
        });
    }
});


// =========================
// LOGIN - MOBILE OR EMAIL
// =========================

app.post("/login", async (req, res) => {

    if (!db) {
        return res.status(500).json({
            success: false,
            message: "Database not configured"
        });
    }

    const { mobile, password } = req.body;

    if (!mobile || !password) {
        return res.status(400).json({
            success: false,
            message: "Please enter mobile/email and password"
        });
    }

    const loginValue = mobile.trim();

    // MOBILE किंवा EMAIL दोन्हीने user शोधा
    const sql = `
        SELECT *
        FROM users
        WHERE phone = ? OR email = ?
        LIMIT 1
    `;

    db.query(
        sql,
        [loginValue, loginValue],
        async (err, result) => {

            if (err) {
                console.log("Login Error:", err.message);

                return res.status(500).json({
                    success: false,
                    message: "Server Error"
                });
            }

            if (result.length === 0) {
                return res.json({
                    success: false,
                    message: "Invalid mobile/email or password"
                });
            }

            const user = result[0];

            let passwordMatch = false;

            // नवीन BCRYPT password
            try {
                passwordMatch = await bcrypt.compare(
                    password,
                    user.password
                );
            } catch (error) {
                passwordMatch = false;
            }

            // जुना plain-text password असल्यास
            if (!passwordMatch && user.password === password) {

                passwordMatch = true;

                // जुना password BCRYPT मध्ये convert
                const newPassword = await bcrypt.hash(
                    password,
                    10
                );

                db.query(
                    "UPDATE users SET password = ? WHERE id = ?",
                    [newPassword, user.id]
                );
            }

            if (!passwordMatch) {
                return res.json({
                    success: false,
                    message: "Invalid mobile/email or password"
                });
            }

            // SESSION
            req.session.user = {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email
            };

            // ADMIN CHECK
            const isAdmin =
                user.email &&
                user.email.toLowerCase() === "admin@goride.com";

            console.log(
                "Login Successful:",
                user.email
            );

            return res.json({
                success: true,
                isAdmin: isAdmin,
                message: isAdmin
                    ? "Admin Login Successful"
                    : "Login Successful"
            });
        }
    );
});
// =========================
// ROUTE PROTECTION
// =========================

function requireLogin(req, res, next) {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login first"
        });
    }

    next();
}


// =========================
// CURRENT LOGGED-IN USER
// =========================

app.get("/me", requireLogin, (req, res) => {

    res.json({
        success: true,
        user: req.session.user
    });

});


// =========================
// LOGOUT
// =========================

app.get("/logout", (req, res) => {

    req.session.destroy((err) => {

        if (err) {
            console.log("Logout Error:", err.message);

            return res.status(500).json({
                success: false,
                message: "Logout failed"
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            success: true,
            message: "Logout Successful"
        });

    });

});
// =========================
// SAVE BOOKING
// =========================

app.post("/booking", (req, res) => {

    if (!db) {
        return res.status(500).json({
            success: false,
            message: "Database not configured"
        });
    }

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
    } = req.body;

    if (
        !customer_name ||
        !mobile ||
        !car_name ||
        !pickup_date ||
        !return_date ||
        !total_price
    ) {
        return res.status(400).json({
            success: false,
            message: "Missing booking details"
        });
    }

    const sql = `
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

    const values = [
        customer_name,
        mobile,
        car_name,
        pickup_date,
        return_date,
        total_price,
        payment_id || null,
        order_id || null,
        payment_status || "Paid",
        "Pending"
    ];

    db.query(sql, values, (err, result) => {

        if (err) {

            console.log(
                "Booking Save Error:",
                err.message
            );

            return res.status(500).json({
                success: false,
                message: "Unable to save booking"
            });
        }

        console.log(
            "Booking Saved:",
            result.insertId
        );

        res.json({
            success: true,
            message: "Booking saved successfully",
            booking_id: result.insertId
        });

    });

});
// =========================
// MY BOOKINGS
// =========================

app.get("/mybookings", (req, res) => {

    if (!db) {
        return res.status(500).json({
            success: false,
            message: "Database not configured"
        });
    }

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please login"
        });
    }

    const sql = `
        SELECT *
        FROM bookings
        WHERE mobile = ?
        ORDER BY id DESC
    `;

    db.query(
        sql,
        [req.session.user.phone],
        (err, result) => {

            if (err) {
                console.log("My Bookings Error:", err.message);

                return res.status(500).json({
                    success: false,
                    message: "Unable to load bookings"
                });
            }

            res.json(result);
        }
    );
});
// =========================
// ALL BOOKINGS - ADMIN
// =========================

app.get("/bookings", (req, res) => {

    if (!db) {
        return res.status(500).json({
            success: false,
            message: "Database not configured"
        });
    }

    db.query(
        "SELECT * FROM bookings ORDER BY id DESC",
        (err, result) => {

            if (err) {
                console.log("Bookings Error:", err.message);

                return res.status(500).json({
                    success: false,
                    message: "Unable to load bookings"
                });
            }

            res.json(result);
        }
    );
});
const PORT = process.env.PORT || 3000;


app.get("/test", (req, res) => {
    res.send("GoRide Server OK");
});
// ================================
// CANCEL BOOKING
// ================================
app.put("/cancel-booking/:id", (req, res) => {
    if (!db) {
        return res.status(500).send("Database not configured");
    }

    if (!req.session.user) {
        return res.status(401).send("Please login");
    }

    const bookingId = req.params.id;
    const mobile = req.session.user.phone;

    const sql = `
        UPDATE bookings
        SET status = 'Cancelled'
        WHERE id = ?
          AND mobile = ?
          AND status = 'Pending'
    `;

    db.query(sql, [bookingId, mobile], (err, result) => {
        if (err) {
            console.log("Cancel Booking Error:", err.message);
            return res.status(500).send("Unable to cancel booking");
        }

        if (result.affectedRows === 0) {
            return res.status(400).send(
                "Booking cannot be cancelled"
            );
        }

        console.log("Booking Cancelled:", bookingId);

        res.send("Booking cancelled successfully");
    });
});
// ================================
// ADMIN DASHBOARD
// ================================
app.get("/dashboard", (req, res) => {

    if (!db) {
        return res.status(500).json({
            success: false,
            message: "Database not configured"
        });
    }

    const dashboardSQL = `
        SELECT
            (SELECT COUNT(*) FROM bookings) AS totalBookings,
            (SELECT COUNT(*) FROM cars) AS totalCars,
            (
                SELECT COUNT(*)
                FROM bookings
                WHERE status = 'Confirmed'
            ) AS bookedCars,
            (
                SELECT COALESCE(SUM(total_price), 0)
                FROM bookings
                WHERE status = 'Confirmed'
            ) AS revenue
    `;

    db.query(dashboardSQL, (err, result) => {

        if (err) {
            console.log(
                "Dashboard Error:",
                err.message
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load dashboard"
            });
        }

        const data = result[0];

        res.json({
            success: true,
            totalBookings: Number(data.totalBookings || 0),
            totalCars: Number(data.totalCars || 0),
            bookedCars: Number(data.bookedCars || 0),
            revenue: Number(data.revenue || 0)
        });

    });

});
// ================================
// ADD CAR
// ================================

app.post("/addCar", upload.single("image"), (req, res) => {

    if (!db) {
        return res.status(500).send("Database not configured");
    }

    const { car_name, category, price } = req.body;

    if (!car_name || !category || !price) {
        return res.status(400).send("Missing car details");
    }

    const image = req.file
        ? req.file.filename
        : null;

    const sql = `
        INSERT INTO cars
        (car_name, category, price, status, image)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [car_name, category, price, "Available", image],
        (err, result) => {

            if (err) {
                console.log("Add Car Error:", err.message);

                return res.status(500).send(
                    "Unable to add car"
                );
            }

            console.log("Car Added:", result.insertId);

            res.send("Car added successfully");
        }
    );

});
// ================================
// GET ALL CARS
// ================================

app.get("/cars", (req, res) => {

    if (!db) {
        return res.status(500).json({
            success: false,
            message: "Database not configured"
        });
    }

    db.query(
        "SELECT * FROM cars ORDER BY id ASC",
        (err, result) => {

            if (err) {
                console.log(
                    "Cars Error:",
                    err.message
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to load cars"
                });
            }

            res.json(result);
        }
    );
});
// ================================
// UPDATE CAR
// ================================

app.post("/updateCar", (req, res) => {

    if (!db) {
        return res.status(500).send("Database not configured");
    }

    const { id, name, type, price } = req.body;

    if (!id || !name || !type || !price) {
        return res.status(400).send("Missing car details");
    }

    const sql = `
        UPDATE cars
        SET
            car_name = ?,
            category = ?,
            price = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            name,
            type,
            price,
            id
        ],
        (err, result) => {

            if (err) {
                console.log(
                    "Update Car Error:",
                    err.message
                );

                return res.status(500).send(
                    "Unable to update car"
                );
            }

            if (result.affectedRows === 0) {
                return res.status(404).send(
                    "Car not found"
                );
            }

            console.log(
                "Car Updated:",
                id
            );

            res.send(
                "Car updated successfully"
            );
        }
    );

});
if (process.env.VERCEL !== "1") {
    app.listen(PORT, () => {
        console.log(`🚗 GoRide Server Started on port ${PORT}`);
    });
}

module.exports = app;