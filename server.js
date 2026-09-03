const cors = require("cors");
require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const path = require("path");
const PDFDocument = require("pdfkit");

const app = express();

// =========================
// MIDDLEWARE
// =========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IMPORTANT:
// This serves index.html, CSS, JS, images, etc.
app.use(cors());
app.use(express.static(__dirname));

app.use(
    session({
        secret: process.env.SESSION_SECRET || "goride_secret_key",
        resave: false,
        saveUninitialized: false
    })
);

// =========================
// HOME PAGE
// =========================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// =========================
// TEST
// =========================

app.get("/test", (req, res) => {
    res.send("TEST OK");
});

// =========================
// RAZORPAY
// =========================

let razorpay = null;

if (
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET
) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    console.log("✅ Razorpay Ready");
} else {
    console.log("⚠️ Razorpay keys not found");
}

// =========================
// MYSQL DATABASE
// =========================

let db = null;

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
            console.log("❌ MySQL Connection Error:", err.message);
        } else {
            console.log("✅ MySQL Connected Successfully");
            connection.release();
        }

    });

} else {

    console.log("⚠️ MySQL environment variables not configured");

}

// =========================
// CARS
// =========================

// =========================
// CARS
// =========================

app.get("/cars", (req, res) => {

    console.log("🚗 /cars API called");

    if (!db) {
        console.log("❌ Database object is NULL");

        return res.status(500).json({
            success: false,
            message: "Database not configured"
        });
    }

    db.query("SELECT * FROM cars", (err, result) => {

        if (err) {
            console.log("❌ Cars Database Error:", err.message);

            return res.status(500).json({
                success: false,
                message: "Unable to load cars",
                error: err.message
            });
        }

        console.log("✅ Cars found:", result.length);

        res.json(result);
    });
});


// =========================
// CREATE RAZORPAY ORDER
// =========================

app.post("/create-order", async (req, res) => {

    try {

        if (!razorpay) {
            return res.status(500).json({
                success: false,
                message: "Razorpay is not configured"
            });
        }

        const amount = Number(req.body.amount);

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            });
        }

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: "goride_" + Date.now()
        });

        res.json({
            success: true,
            order: order,
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (err) {

        console.log("Razorpay Order Error:", err);

        res.status(500).json({
            success: false,
            message: "Order Failed"
        });
    }
});
// =========================
// VERIFY RAZORPAY PAYMENT
// =========================

app.post("/verify-payment", (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment verification data missing"
            });
        }

        const generatedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(
                razorpay_order_id + "|" + razorpay_payment_id
            )
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }

        res.json({
            success: true,
            message: "Payment Verified Successfully",
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id
        });

    } catch (err) {
        console.log("Payment Verification Error:", err);

        res.status(500).json({
            success: false,
            message: "Payment verification error"
        });
    }
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
            message: "Please fill all booking details"
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

    db.query(
        sql,
        [
            customer_name,
            mobile,
            car_name,
            pickup_date,
            return_date,
            total_price,
            payment_id || null,
            order_id || null,
            payment_status || "Pending",
            "Booked"
        ],
        (err, result) => {

            if (err) {

                console.log("Booking Error:", err.message);

                return res.status(500).json({
                    success: false,
                    message: "Booking Failed"
                });
            }

            res.json({
                success: true,
                message: "Booking Saved Successfully",
                booking_id: result.insertId
            });
        }
    );
});

// =========================
// REGISTER
// =========================

app.post("/register", (req, res) => {

    if (!db) {
        return res.status(500).json({
            success: false,
            message: "Database not configured"
        });
    }

    const {
        name,
        phone,
        email,
        password
    } = req.body;

    if (!name || !phone || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please fill all fields"
        });
    }

    const sql = `
        INSERT INTO users
        (name, phone, email, password)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [name, phone, email, password],
        (err) => {

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
});

// =========================
// LOGIN
// =========================

app.post("/login", (req, res) => {

    if (!db) {
        return res.status(500).json({
            success: false,
            message: "Database not configured"
        });
    }

    const {
        mobile,
        password
    } = req.body;

    if (!mobile || !password) {
        return res.status(400).json({
            success: false,
            message: "Please enter mobile and password"
        });
    }

    const sql = `
        SELECT *
        FROM users
        WHERE phone = ?
        AND password = ?
        LIMIT 1
    `;

    db.query(
        sql,
        [mobile, password],
        (err, result) => {

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
                    message: "Invalid mobile or password"
                });
            }

            const user = result[0];

            req.session.user = {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email
            };

            if (user.email === "admin@goride.com") {

                return res.json({
                    success: true,
                    isAdmin: true,
                    message: "Admin Login Successful"
                });
            }

            res.json({
                success: true,
                isAdmin: false,
                message: "Login Successful"
            });
        }
    );
});

// =========================
// LOGOUT
// =========================

app.get("/logout", (req, res) => {

    req.session.destroy(() => {
        res.json({
            success: true,
            message: "Logged out"
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
// ALL BOOKINGS
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
// UPDATE STATUS
// =========================

app.post("/updateStatus", (req, res) => {

    if (!db) {
        return res.status(500).json({
            success: false,
            message: "Database not configured"
        });
    }

    const { id, status } = req.body;

    if (!id || !status) {
        return res.status(400).json({
            success: false,
            message: "Missing information"
        });
    }

    db.query(
        "UPDATE bookings SET status = ? WHERE id = ?",
        [status, id],
        (err) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: "Update Failed"
                });
            }

            res.json({
                success: true,
                message: "Status Updated"
            });
        }
    );
});

// =========================
// DELETE BOOKING
// =========================

app.post("/deleteBooking", (req, res) => {

    if (!db) {
        return res.status(500).json({
            success: false,
            message: "Database not configured"
        });
    }

    const { id } = req.body;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Booking ID missing"
        });
    }

    db.query(
        "DELETE FROM bookings WHERE id = ?",
        [id],
        (err) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: "Delete Failed"
                });
            }

            res.json({
                success: true,
                message: "Booking Deleted"
            });
        }
    );
});

// =========================
// DASHBOARD
// =========================

app.get("/dashboard", (req, res) => {

    if (!db) {
        return res.status(500).json({
            success: false,
            message: "Database not configured"
        });
    }

    const dashboard = {};

    db.query(
        "SELECT COUNT(*) AS totalBookings FROM bookings",
        (err, bookingResult) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Dashboard Error"
                });
            }

            dashboard.totalBookings =
                bookingResult[0].totalBookings;

            db.query(
                "SELECT COUNT(*) AS totalCars FROM cars",
                (err, carResult) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Dashboard Error"
                        });
                    }

                    dashboard.totalCars =
                        carResult[0].totalCars;

                    db.query(
                        `SELECT COUNT(*) AS bookedCars
                         FROM bookings
                         WHERE status = 'Booked'`,
                        (err, bookedResult) => {

                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: "Dashboard Error"
                                });
                            }

                            dashboard.bookedCars =
                                bookedResult[0].bookedCars;

                            db.query(
                                `SELECT COALESCE(SUM(total_price), 0)
                                 AS revenue
                                 FROM bookings
                                 WHERE payment_status = 'Paid'`,
                                (err, revenueResult) => {

                                    if (err) {
                                        return res.status(500).json({
                                            success: false,
                                            message: "Dashboard Error"
                                        });
                                    }

                                    dashboard.revenue =
                                        revenueResult[0].revenue;

                                    res.json({
                                        success: true,
                                        ...dashboard
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

// =========================
// INVOICE
// =========================

app.get("/invoice/:id", (req, res) => {

    if (!db) {
        return res.status(500).send("Database not configured");
    }

    const bookingId = req.params.id;

    db.query(
        "SELECT * FROM bookings WHERE id = ?",
        [bookingId],
        (err, result) => {

            if (err) {
                return res.status(500).send("Invoice Error");
            }

            if (result.length === 0) {
                return res.status(404).send("Booking Not Found");
            }

            const booking = result[0];

            const doc = new PDFDocument({
                size: "A4",
                margin: 50
            });

            res.setHeader(
                "Content-Type",
                "application/pdf"
            );

            res.setHeader(
                "Content-Disposition",
                `inline; filename=GoRide-Invoice-${booking.id}.pdf`
            );

            doc.pipe(res);

            doc
                .fontSize(30)
                .font("Helvetica-Bold")
                .text("GoRide", {
                    align: "center"
                });

            doc
                .fontSize(11)
                .font("Helvetica")
                .text("Drive Freely, Live Fully", {
                    align: "center"
                });

            doc.moveDown();

            doc
                .fontSize(22)
                .font("Helvetica-Bold")
                .text("INVOICE", {
                    align: "center"
                });

            doc.moveDown();

            doc
                .fontSize(11)
                .font("Helvetica-Bold")
                .text(`Invoice No: GR-${booking.id}`);

            doc
                .font("Helvetica")
                .text(`Booking ID: ${booking.id}`)
                .text(`Payment ID: ${booking.payment_id || "N/A"}`)
                .text(
                    `Payment Status: ${
                        booking.payment_status || "Pending"
                    }`
                );

            doc.moveDown();

            doc
                .fontSize(15)
                .font("Helvetica-Bold")
                .text("CUSTOMER DETAILS");

            doc.moveDown(0.5);

            doc
                .fontSize(11)
                .font("Helvetica")
                .text(`Name: ${booking.customer_name}`)
                .text(`Mobile: ${booking.mobile}`);

            doc.moveDown();

            doc
                .fontSize(15)
                .font("Helvetica-Bold")
                .text("BOOKING DETAILS");

            doc.moveDown(0.5);

            doc
                .fontSize(11)
                .font("Helvetica")
                .text(`Car: ${booking.car_name}`)
                .text(`Pickup Date: ${booking.pickup_date}`)
                .text(`Return Date: ${booking.return_date}`);

            doc.moveDown();

            doc
                .fontSize(15)
                .font("Helvetica-Bold")
                .text("PAYMENT DETAILS");

            doc.moveDown(0.5);

            doc
                .fontSize(13)
                .font("Helvetica")
                .text(`Total Amount: Rs. ${booking.total_price}`);

            doc.moveDown(2);

            doc
                .fontSize(13)
                .font("Helvetica-Bold")
                .text(
                    "Thank you for choosing GoRide!",
                    { align: "center" }
                );

            doc
                .fontSize(10)
                .font("Helvetica")
                .text(
                    "Drive safely and enjoy your journey.",
                    { align: "center" }
                );

            doc.moveDown(2);

            doc
                .fontSize(9)
                .text(
                    "This is a computer-generated invoice.",
                    { align: "center" }
                );

            doc
                .text(
                    "GoRide | Drive Freely, Live Fully",
                    { align: "center" }
                );

            doc.end();
        }
    );
});
// =========================
// LOCAL SERVER
// =========================

if (require.main === module) {

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(
            `GoRide Server Started on port ${PORT}`
        );
    });
}

module.exports = app;
