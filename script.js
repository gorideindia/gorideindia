// =====================
// CAR PRICE
// =====================

function calculatePrice() {

    const car = document.getElementById("car");
    const price = document.getElementById("price");

    if (!car || !price) return;

    switch (car.value) {

        case "Tata Punch":
            price.value = 1900;
            break;

        case "Maruti Swift":
            price.value = 1900;
            break;

        case "Brezza":
            price.value = 2200;
            break;

        case "Creta":
            price.value = 2500;
            break;

        case "Innova":
            price.value = 3000;
            break;

        default:
            price.value = "";
    }

    calculateTotal();
}


// =====================
// DAYS
// =====================

function calculateDays() {

    const pickup = document.getElementById("pickup");
    const ret = document.getElementById("return");

    if (!pickup || !ret) return;

    if (pickup.value === "" || ret.value === "") return;

    let days = (new Date(ret.value) - new Date(pickup.value)) / (1000 * 60 * 60 * 24);

    if (days <= 0) {
        alert("Return date must be after Pickup date");
        document.getElementById("days").value = "";
        document.getElementById("total").value = "";
        return;
    }

    document.getElementById("days").value = days;

    calculateTotal();
}


// =====================
// TOTAL
// =====================

function calculateTotal() {

    const days = Number(document.getElementById("days").value);
    const price = Number(document.getElementById("price").value);

    document.getElementById("total").value = "₹" + (days * price);

}


// =====================
// START PAYMENT
// =====================

function startPayment() {

    const amount = Number(
        document.getElementById("total").value.replace("₹", "")
    );

    if (!amount) {
        alert("Please select car and dates");
        return;
    }

    fetch("/create-order", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            amount: 1
        })

    })

    .then(res => res.json())

    .then(data => {

        if (!data.success) {

            alert("Order Failed");
            return;

        }

        const options = {

            key:"rzp_test_TKw3ivAo9v0OvC",

            amount:data.order.amount,

            currency: "INR",

            name: "GoRide",

            description: "Car Booking",

            order_id: data.order.id,

            handler: function (response) {

    saveBooking(
        response.razorpay_payment_id,
        response.razorpay_order_id
    );

},

                

            

            prefill: {

                name: document.getElementById("name").value,

                contact: document.getElementById("mobile").value

            },

            theme: {

                color: "#0d6efd"

            }

        };

        const rzp = new Razorpay(options);

        rzp.open();

    });

}
// =====================
// SAVE BOOKING
// =====================

function saveBooking(paymentId, orderId) {

    const booking = {

        customer_name: document.getElementById("name").value,
        mobile: document.getElementById("mobile").value,
        car_name: document.getElementById("car").value,
        pickup_date: document.getElementById("pickup").value,
        return_date: document.getElementById("return").value,

        total_price: document.getElementById("total").value.replace("₹", ""),

        payment_id: paymentId,
        order_id: orderId,
        payment_status: "Paid"

    };

    fetch("/booking", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(booking)

    })

    .then(res => res.text())

    .then(data => {

        alert(data);

        if (data.includes("Successfully")) {

            location.href = "profile.html";

        }

    })

    .catch(() => {

        alert("Booking Failed");

    });

}


// =====================
// LOAD CARS
// =====================

const carsList = document.getElementById("cars-list");

if (carsList) {

    fetch("/cars")

    .then(res => res.json())

    .then(cars => {

        carsList.innerHTML = "";

        cars.forEach(car => {

            carsList.innerHTML += `

            <div class="car-card">

                <img src="images/${car.image}" alt="${car.car_name}" width="220">

                <h2>${car.car_name}</h2>

                <p>${car.category}</p>

                <p>₹${car.price} / Day</p>

                <p>Status : ${car.status}</p>

                <button onclick="bookCar('${car.car_name}')">
                    Book Now
                </button>

            </div>

            `;

        });

    })

    .catch(err => {

        console.log(err);

    });

}


// =====================
// BOOK CAR
// =====================

function bookCar(car) {

    localStorage.setItem("selectedCar", car);

    location.href = "booking.html";

}
// =====================
// REGISTER
// =====================

function registerUser() {

    const user = {
        name: document.getElementById("name").value,
        phone: document.getElementById("mobile").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };

    fetch("/register", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(user)

    })

    .then(res => res.text())

    .then(data => {

        alert(data);

        if (data.includes("Successful")) {

            location.href = "login.html";

        }

    })

    .catch(() => {

        alert("Registration Failed");

    });

}


// =====================
// LOGIN
// =====================

function login() {

    const mobile = document.getElementById("mobile").value;
    const password = document.getElementById("password").value;

    fetch("/login", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            mobile,
            password
        })

    })

    .then(res => res.json())

    .then(data => {

        if (data.success) {

            if (data.isAdmin) {

                location.href = "admin.html";

            } else {

                location.href = "profile.html";

            }

        } else {

            alert(data.message);

        }

    })

    .catch(err => {

        console.log(err);
        alert("Server Error");

    });

}


console.log("GoRide Script Loaded Successfully");