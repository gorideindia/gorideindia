// ========================================
// GoRide - Car Details
// ========================================

// Get car name from URL
const params = new URLSearchParams(window.location.search);
const car = params.get("car");

// ========================================
// CAR DATA
// ========================================

const cars = {

    i20: {
        name: "Hyundai i20",
        price: "₹1900 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Manual",
        seats: "Seats: 5",
        image: "i20.jpg"
    },

    swift: {
        name: "Maruti Swift",
        price: "₹1800 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Manual",
        seats: "Seats: 5",
        image: "swift.jpg"
    },

    baleno: {
        name: "Maruti Baleno",
        price: "₹1900 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Manual",
        seats: "Seats: 5",
        image: "baleno.jpg"
    },

    altroz: {
        name: "Tata Altroz",
        price: "₹1900 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Manual",
        seats: "Seats: 5",
        image: "altroz.jpg"
    },

    punch: {
        name: "Tata Punch",
        price: "₹1900 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Manual",
        seats: "Seats: 5",
        image: "punch.jpg"
    },

    tiago: {
        name: "Tata Tiago",
        price: "₹1800 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Manual",
        seats: "Seats: 5",
        image: "tiago.jpg"
    },

    wagonr: {
        name: "Maruti WagonR",
        price: "₹1700 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Manual",
        seats: "Seats: 5",
        image: "wagonr.jpg"
    },

    brezza: {
        name: "Maruti Brezza",
        price: "₹2200 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Manual",
        seats: "Seats: 5",
        image: "brezza.jpg"
    },

    nexon: {
        name: "Tata Nexon",
        price: "₹2200 / Day",
        fuel: "Fuel: Petrol/Diesel",
        transmission: "Transmission: Manual",
        seats: "Seats: 5",
        image: "nexon.jpg"
    },

    venue: {
        name: "Hyundai Venue",
        price: "₹2300 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Manual",
        seats: "Seats: 5",
        image: "venue.jpg"
    },

    sonet: {
        name: "Kia Sonet",
        price: "₹2300 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Automatic",
        seats: "Seats: 5",
        image: "sonet.jpg"
    },

    creta: {
        name: "Hyundai Creta",
        price: "₹2500 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Automatic",
        seats: "Seats: 5",
        image: "creta.jpg"
    },

    seltos: {
        name: "Kia Seltos",
        price: "₹2500 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Automatic",
        seats: "Seats: 5",
        image: "seltos.jpg"
    },

    grandvitara: {
        name: "Grand Vitara",
        price: "₹2600 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Automatic",
        seats: "Seats: 5",
        image: "grandvitara.jpg"
    },

    scorpion: {
        name: "Mahindra Scorpio N",
        price: "₹3000 / Day",
        fuel: "Fuel: Diesel",
        transmission: "Transmission: Manual",
        seats: "Seats: 7",
        image: "scorpion.jpg"
    },

    xuv700: {
        name: "Mahindra XUV700",
        price: "₹3200 / Day",
        fuel: "Fuel: Diesel",
        transmission: "Transmission: Automatic",
        seats: "Seats: 7",
        image: "xuv700.jpg"
    },

    ertiga: {
        name: "Maruti Ertiga",
        price: "₹2500 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Manual",
        seats: "Seats: 7",
        image: "ertiga.jpg"
    },

    innovacrysta: {
        name: "Toyota Innova Crysta",
        price: "₹3500 / Day",
        fuel: "Fuel: Diesel",
        transmission: "Transmission: Manual",
        seats: "Seats: 7",
        image: "innova-crysta.jpg"
    },

    hycross: {
        name: "Toyota Innova Hycross",
        price: "₹4000 / Day",
        fuel: "Fuel: Hybrid",
        transmission: "Transmission: Automatic",
        seats: "Seats: 7",
        image: "hycross.jpg"
    },

    thar: {
        name: "Mahindra Thar",
        price: "₹3200 / Day",
        fuel: "Fuel: Diesel",
        transmission: "Transmission: Manual",
        seats: "Seats: 4",
        image: "thar.jpg"
    },

    city: {
        name: "Honda City",
        price: "₹2500 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Automatic",
        seats: "Seats: 5",
        image: "city.jpg"
    },

    verna: {
        name: "Hyundai Verna",
        price: "₹2600 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Automatic",
        seats: "Seats: 5",
        image: "verna.jpg"
    },

    virtus: {
        name: "Volkswagen Virtus",
        price: "₹2700 / Day",
        fuel: "Fuel: Petrol",
        transmission: "Transmission: Automatic",
        seats: "Seats: 5",
        image: "virtus.jpg"
    },

    premium: {
        name: "BMW / Mercedes",
        price: "₹7000 / Day",
        fuel: "Luxury",
        transmission: "Transmission: Automatic",
        seats: "Seats: 5",
        image: "bmw.jpg"
    }

};


// ========================================
// LOAD CAR DETAILS
// ========================================

const data = cars[car];

if (!data) {

    console.error("Car not found:", car);

    document.getElementById("carName").textContent =
        "Car Not Found";

} else {

    const carName = document.getElementById("carName");
    const carPrice = document.getElementById("carPrice");
    const carFuel = document.getElementById("carFuel");
    const carTransmission = document.getElementById("carTransmission");
    const carSeats = document.getElementById("carSeats");
    const carImage = document.getElementById("carImage");

    if (carName) {
        carName.textContent = data.name;
    }

    if (carPrice) {
        carPrice.textContent = data.price;
    }

    if (carFuel) {
        carFuel.textContent = data.fuel;
    }

    if (carTransmission) {
        carTransmission.textContent = data.transmission;
    }

    if (carSeats) {
        carSeats.textContent = data.seats;
    }

    if (carImage) {
        carImage.src = data.image;
        carImage.alt = data.name;

        carImage.onerror = function () {
            console.error("Image not found:", data.image);
        };
    }
}


// ========================================
// BOOK NOW
// ========================================

function bookSelectedCar() {

    if (!data) {
        alert("Car details not available.");
        return;
    }

    localStorage.setItem("selectedCar", data.name);

    window.location.href = "booking.html";
}