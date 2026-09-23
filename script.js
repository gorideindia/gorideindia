// ===============================
// GoRide - script.js
// ===============================

let pricePerDay = 0;

// ===============================
// CAR PRICES
// ===============================
const carPrices = {
    "Tata Punch": {
        8: 475,
        12: 950,
        24: 1900
    },

    "Maruti Swift": {
        8: 475,
        12: 950,
        24: 1900
    },

    "Brezza": {
        8: 550,
        12: 1100,
        24: 2200
    },

    "Creta": {
        8: 625,
        12: 1250,
        24: 2500
    },

    "Innova": {
        8: 750,
        12: 1500,
        24: 3000
    }
};
// ===============================
// RENTAL CHARGES
// ===============================

function updateRentalCharges() {

    const carElement = document.getElementById("car");
    const depositElement =
        document.getElementById("depositAmount");

    if (!carElement || !depositElement) return;

    const car = carElement.value;

    let deposit = 0;

    // Hatchback
    if (
        car === "Tata Punch" ||
        car === "Maruti Swift"
    ) {
        deposit = 3000;
    }

    // Compact SUV
    else if (
        car === "Brezza" ||
        car === "Creta"
    ) {
        deposit = 3000;
    }

    // 7-Seater
    else if (
        car === "Innova"
    ) {
        deposit = 5000;
    }

    if (deposit > 0) {
        depositElement.innerText =
            "₹" + deposit.toLocaleString("en-IN");
    } else {
        depositElement.innerText =
            "Select Car";
    }
}


// ===============================
// CALCULATE PRICE
// ===============================
function calculatePrice() {

    const carElement =
        document.getElementById("car");

    const durationElement =
        document.getElementById("duration");

    const priceElement =
        document.getElementById("price");

    if (
        !carElement ||
        !durationElement ||
        !priceElement
    ) {
        return;
    }

    const car =
        carElement.value;

    const duration =
        Number(durationElement.value);

    if (
        !car ||
        !duration ||
        !carPrices[car]
    ) {

        pricePerDay = 0;

        priceElement.value = "";

        updateRentalCharges();

        return;
    }

    pricePerDay =
        carPrices[car][duration] || 0;

    priceElement.value =
        pricePerDay > 0
            ? "₹" +
              pricePerDay.toLocaleString("en-IN")
            : "";

    updateRentalCharges();
}


// ===============================
// CALCULATE DAYS
// ===============================

function calculateDays() {

    const pickupElement = document.getElementById("pickup");
    const returnElement = document.getElementById("return");
    const daysElement = document.getElementById("days");
    const totalElement = document.getElementById("total");

    if (
        !pickupElement ||
        !returnElement ||
        !daysElement ||
        !totalElement
    ) {
        return;
    }

    const pickup = pickupElement.value;
    const returnDate = returnElement.value;

    if (!pickup || !returnDate) {

        daysElement.value = "";
        totalElement.value = "";

        return;
    }

    const pickupDate = new Date(pickup);
    const endDate = new Date(returnDate);

    const difference =
        endDate.getTime() - pickupDate.getTime();

    let days =
        Math.ceil(
            difference / (1000 * 60 * 60 * 24)
        );

    if (days <= 0) {

        daysElement.value = "";
        totalElement.value = "";

        return;
    }

    daysElement.value = days;

    const total = days * pricePerDay;

    totalElement.value =
        total > 0 ? "₹" + total : "";
}


// ===============================
// VALIDATE BOOKING
// ===============================

function validateBooking() {

    const name =
        document.getElementById("name")?.value.trim();

    const mobile =
        document.getElementById("mobile")?.value.trim();

    const pickup =
        document.getElementById("pickup")?.value;

    const returnDate =
        document.getElementById("return")?.value;

    const car =
        document.getElementById("car")?.value;

    if (!name) {
        alert("Please enter your full name.");
        return false;
    }

    if (!mobile) {
        alert("Please enter your mobile number.");
        return false;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
        alert("Please enter a valid 10 digit mobile number.");
        return false;
    }

    if (!pickup) {
        alert("Please select pickup date.");
        return false;
    }

    if (!returnDate) {
        alert("Please select return date.");
        return false;
    }

    if (!car) {
        alert("Please select a car.");
        return false;
    }

    if (!pricePerDay) {
        alert("Unable to calculate car price.");
        return false;
    }

    const pickupDate = new Date(pickup);
    const endDate = new Date(returnDate);

    if (endDate <= pickupDate) {
        alert("Return date must be after pickup date.");
        return false;
    }

    return true;
}


// ===============================
// START PAYMENT
// ===============================

async function startPayment() {

    if (!validateBooking()) {
        return;
    }

    const name =
        document.getElementById("name").value.trim();

    const mobile =
        document.getElementById("mobile").value.trim();

    const car =
        document.getElementById("car").value;

    const pickup =
        document.getElementById("pickup").value;

    const returnDate =
        document.getElementById("return").value;

    const days =
        Number(document.getElementById("days").value);

    const totalText =
        document.getElementById("total").value;

    const amount =
        Number(
            totalText
                .replace("₹", "")
                .replace(",", "")
                .trim()
        );

    if (!amount || amount <= 0) {

        alert("Invalid booking amount.");

        return;
    }

    try {

        // ===============================
        // CREATE RAZORPAY ORDER
        // ===============================

        const orderResponse =
            await fetch("/create-order", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    amount: amount
                })
            });

        const orderData =
            await orderResponse.json();

        if (
            !orderResponse.ok ||
            !orderData.success
        ) {

            console.error(
                "Order Error:",
                orderData
            );

            alert(
                orderData.message ||
                "Unable to create payment order."
            );

            return;
        }

        const order =
            orderData.order;

        const keyId =
            orderData.key_id;

        if (!keyId) {

            alert(
                "Razorpay Key ID is missing from server."
            );

            return;
        }


        // ===============================
        // RAZORPAY CHECKOUT
        // ===============================

        const options = {

            key: keyId,

            amount: order.amount,

            currency: order.currency || "INR",

            name: "GoRide",

            description:
                `${car} Booking - ${days} Day(s)`,

            order_id: order.id,

            prefill: {

                name: name,

                contact: mobile

            },

            notes: {

                customer_name: name,

                mobile: mobile,

                car_name: car,

                pickup_date: pickup,

                return_date: returnDate

            },

            theme: {

                color: "#111111"

            },

            handler:
                async function (response) {

                    console.log(
                        "Razorpay Success:",
                        response
                    );

                    await verifyPaymentAndSaveBooking(
                        response,
                        {
                            name,
                            mobile,
                            car,
                            pickup,
                            returnDate,
                            amount
                        }
                    );
                },

            modal: {

                ondismiss: function () {

                    console.log(
                        "Razorpay Checkout Closed"
                    );

                }

            }
        };


        if (
            typeof Razorpay ===
            "undefined"
        ) {

            alert(
                "Razorpay Checkout failed to load."
            );

            return;
        }


        const razorpay =
            new Razorpay(options);


        razorpay.on(
            "payment.failed",
            function (response) {

                console.error(
                    "Payment Failed:",
                    response.error
                );

                alert(
                    response.error?.description ||
                    "Payment failed. Please try again."
                );
            }
        );


        razorpay.open();


    } catch (error) {

        console.error(
            "Payment Error:",
            error
        );

        alert(
            "Unable to connect to payment server."
        );
    }
}


// ===============================
// VERIFY PAYMENT + SAVE BOOKING
// ===============================

async function verifyPaymentAndSaveBooking(
    paymentResponse,
    booking
) {

    try {

        // ===============================
        // VERIFY PAYMENT
        // ===============================

        const verifyResponse =
            await fetch(
                "/verify-payment",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        razorpay_order_id:
                            paymentResponse
                                .razorpay_order_id,

                        razorpay_payment_id:
                            paymentResponse
                                .razorpay_payment_id,

                        razorpay_signature:
                            paymentResponse
                                .razorpay_signature
                    })
                }
            );


        const verifyData =
            await verifyResponse.json();


        if (
            !verifyResponse.ok ||
            !verifyData.success
        ) {

            console.error(
                "Verification Failed:",
                verifyData
            );

            alert(
                verifyData.message ||
                "Payment verification failed."
            );

            return;
        }


        // ===============================
        // SAVE BOOKING
        // ===============================

        const bookingResponse =
            await fetch(
                "/booking",
                    "https://gorideindia-production.up.railway.app/login",

                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        customer_name:
                            booking.name,

                        mobile:
                            booking.mobile,

                        car_name:
                            booking.car,

                        pickup_date:
                            booking.pickup,

                        return_date:
                            booking.returnDate,

                        total_price:
                            booking.amount,

                        payment_id:
                            paymentResponse
                                .razorpay_payment_id,

                        order_id:
                            paymentResponse
                                .razorpay_order_id,

                        payment_status:
                            "Paid"
                    })
                }
            );


        const bookingData =
            await bookingResponse.json();


        if (
            !bookingResponse.ok ||
            !bookingData.success
        ) {

            console.error(
                "Booking Save Error:",
                bookingData
            );

            alert(
                "Payment successful, but booking could not be saved. Please contact GoRide."
            );

            return;
        }


        // ===============================
        // SHOW BOOKING ID
        // ===============================

        const bookingIdElement =
            document.getElementById(
                "bookingId"
            );

        if (bookingIdElement) {

            bookingIdElement.value =
                bookingData.booking_id;
        }


        alert(
            "🎉 Payment Successful!\n\n" +
            "Booking ID: " +
            bookingData.booking_id
        );


        // ===============================
        // CLEAR SELECTED CAR
        // ===============================

        localStorage.removeItem(
            "selectedCar"
        );


    } catch (error) {

        console.error(
            "Verify / Booking Error:",
            error
        );

        alert(
            "Payment was completed, but there was a problem saving the booking."
        );
    }
}


window.addEventListener(
    "DOMContentLoaded",
    function () {

        // ===============================
        // DATE VALIDATION
        // ===============================

        const pickupElement =
            document.getElementById("pickup");

        const returnElement =
            document.getElementById("return");

        if (pickupElement && returnElement) {

            // Today's date
            const today =
                new Date().toISOString().split("T")[0];

            // Pickup cannot be before today
            pickupElement.min = today;

            // Return initially cannot be before today
            returnElement.min = today;

            // Return date must be
            // same as or after pickup date
            pickupElement.addEventListener(
                "change",
                function () {

                    returnElement.min =
                        pickupElement.value;

                    if (
                        returnElement.value &&
                        returnElement.value <
                        pickupElement.value
                    ) {

                        returnElement.value = "";
                    }
                }
            );
        }


        // ===============================
        // LOAD SELECTED CAR
        // ===============================

        const selectedCar =
            localStorage.getItem("selectedCar");

        const carElement =
            document.getElementById("car");

        if (
            selectedCar &&
            carElement
        ) {

            carElement.value =
                selectedCar;

            calculatePrice();
        }

    }
);


// ===============================
// EXPORT FUNCTIONS FOR HTML
// ===============================

window.calculatePrice =
    calculatePrice;

window.calculateDays =
    calculateDays;

window.startPayment =
    startPayment;
    // ===============================
// LOAD CARS ON HOME PAGE
// ===============================

async function loadCars() {

    const carsList = document.getElementById("cars-list");

    if (!carsList) return;

    try {

        const response = await fetch("/cars");
        const cars = await response.json();

        if (!response.ok || !Array.isArray(cars)) {
            carsList.innerHTML = "<p>Unable to load cars.</p>";
            return;
        }

        carsList.innerHTML = "";

        cars.forEach(car => {

            const card = document.createElement("div");

            card.className = "car-card";

            card.innerHTML = `
            <img src="images/${car.image}"
     alt="${car.car_name}">

                <h2>${car.car_name}</h2>

                <p>${car.category || "Self Drive Car"}</p>

                <p>₹${car.price}/day</p>

                <button onclick="selectCar('${car.car_name}')">
                    BOOK NOW
                </button>
            `;

            carsList.appendChild(card);
        });

    } catch (error) {

        console.error("Load Cars Error:", error);

        carsList.innerHTML =
            "<p>Unable to load cars.</p>";
    }
}


// ===============================
// SELECT CAR
// ===============================

function selectCar(carName) {

    localStorage.setItem("selectedCar", carName);

    window.location.href = "booking.html";
}


// ===============================
// START
// ===============================

window.addEventListener(
    "DOMContentLoaded",
    loadCars
);

window.selectCar = selectCar;
// ===============================
// LOGIN (FIXED)
// =============================// ===============================
// LOGIN
// ===============================

async function login() {

    try {

        const mobile =
            document.getElementById("mobile").value.trim();

        const password =
            document.getElementById("password").value;

        if (!mobile || !password) {
            alert("Please enter mobile and password.");
            return;
        }

        const response = await fetch(
            "http://localhost:3000/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    mobile: mobile,
                    password: password
                })
            }
        );

        const data = await response.json();

        console.log("Login Response:", data);

        if (!data.success) {
            alert(
                data.message ||
                "Invalid mobile or password."
            );
            return;
        }

        alert("Login Successful 🚗");

        if (data.isAdmin) {
    window.location.href = "admin.html";
} else {
    window.location.href = "index.html";
}

    } catch (error) {

        console.error("Login Error:", error);

        alert("Unable to connect to server.");
    }
}

window.login = login;