const params = new URLSearchParams(window.location.search);
const car = params.get("car");

const cars = {

i20:{
name:"Hyundai i20",
price:"₹1900 / Day",
fuel:"Fuel : Petrol",
transmission:"Transmission : Manual",
seats:"Seats : 5",
image:"i20.jpg"
},

swift:{
name:"Maruti Swift",
price:"₹1800 / Day",
fuel:"Fuel : Petrol",
transmission:"Transmission : Manual",
seats:"Seats : 5",
image:"swift.jpg"
},

baleno:{
name:"Maruti Baleno",
price:"₹1900 / Day",
fuel:"Fuel : Petrol",
transmission:"Transmission : Manual",
seats:"Seats : 5",
image:"baleno.jpg"
},

altroz:{
name:"Tata Altroz",
price:"₹1900 / Day",
fuel:"Fuel : Petrol",
transmission:"Transmission : Manual",
seats:"Seats : 5",
image:"altroz.jpg"
},

punch:{
name:"Tata Punch",
price:"₹1900 / Day",
fuel:"Fuel : Petrol",
transmission:"Transmission : Manual",
seats:"Seats : 5",
image:"punch.jpg"
},

brezza:{
name:"Maruti Brezza",
price:"₹2200 / Day",
fuel:"Fuel : Petrol",
transmission:"Transmission : Manual",
seats:"Seats : 5",
image:"brezza.jpg"
}

};

const data = cars[car];

if(data){
document.getElementById("carName").innerHTML = data.name;
document.getElementById("carPrice").innerHTML = data.price;
document.getElementById("carFuel").innerHTML = data.fuel;
document.getElementById("carTransmission").innerHTML = data.transmission;
document.getElementById("carSeats").innerHTML = data.seats;
document.getElementById("carImage").src = data.image;
}