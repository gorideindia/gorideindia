// ==========================
// LOAD BOOKINGS
// ==========================

function loadBookings() {

    fetch("/bookings")
    .then(res => res.json())
    .then(data => {

        const table = document.getElementById("bookingTable");

        table.innerHTML = "";

        let confirmed = 0;
        let pending = 0;

        document.getElementById("totalBookings").innerText = data.length;

        data.forEach(booking => {

            if (booking.status === "Confirmed") {
                confirmed++;
            } else {
                pending++;
            }

            table.innerHTML += `
            <tr>

                <td>${booking.id}</td>

                <td>${booking.customer_name}</td>

                <td>${booking.mobile}</td>

                <td>${booking.car_name}</td>

                <td>${new Date(booking.pickup_date).toLocaleDateString("en-GB")}</td>

                <td>${new Date(booking.return_date).toLocaleDateString("en-GB")}</td>

                <td>₹${booking.total_price}</td>

                <td>${booking.status}</td>

                <td>

                ${
                    booking.status=="Pending"
                    ?
                    `<button class="confirm"
                    onclick="confirmBooking(${booking.id})">
                    Confirm
                    </button>`
                    :
                    `<button disabled>
                    Confirmed
                    </button>`
                }

                <button class="delete"
                onclick="deleteBooking(${booking.id})">
                Delete
                </button>

                </td>

            </tr>
            `;

        });

        document.getElementById("confirmedBookings").innerText = confirmed;
        document.getElementById("pendingBookings").innerText = pending;

    });

}

// ==========================
// CONFIRM BOOKING
// ==========================

function confirmBooking(id){

    fetch("/confirm-booking/"+id,{
        method:"PUT"
    })
    .then(()=>{

        loadBookings();

    });

}

// ==========================
// DELETE BOOKING
// ==========================

function deleteBooking(id){

    if(!confirm("Delete Booking?")) return;

    fetch("/delete-booking/"+id,{
        method:"DELETE"
    })

    .then(res=>res.text())

    .then(msg=>{

        alert(msg);

        loadBookings();

    });

}

// ==========================
// DASHBOARD
// ==========================

fetch("/dashboard")
.then(res => res.json())
.then(data => {

    document.getElementById("totalBookings").innerText = data.totalBookings;
    document.getElementById("totalCars").innerText = data.totalCars;
    document.getElementById("bookedCars").innerText = data.bookedCars;
    document.getElementById("totalRevenue").innerText = "₹" + data.revenue;

});
// ==========================
// LOAD CARS
// ==========================

function loadCars() {

    fetch("/cars")
    .then(res => res.json())
    .then(data => {

        const table = document.getElementById("carTable");

        table.innerHTML = "";

        data.forEach(car => {

            table.innerHTML += `
            <tr>

                <td>${car.id}</td>

                <td>
                    <td>
             <img src="images/${car.image}"
               width="100"
               height="60"
                      style="border-radius:8px;">
                             </td>
                

                <td>${car.car_name}</td>

                <td>${car.category}</td>

                <td>₹${car.price}</td>

                <td>

                    <button class="edit"
                    onclick="editCar(${car.id},'${car.car_name}','${car.category}',${car.price})">
                    Edit
                    </button>

                    <button class="delete"
                    onclick="deleteCar(${car.id})">
                    Delete
                    </button>

                </td>

            </tr>
            `;

        });

    });

}

// ==========================
// ADD CAR
// ==========================
function addCar() {

    const formData = new FormData();

    formData.append("car_name", document.getElementById("carName").value);
    formData.append("category", document.getElementById("category").value);
    formData.append("price", document.getElementById("price").value);

    const file = document.getElementById("image").files[0];
    formData.append("image", file);

    fetch("/addCar", {
        method: "POST",
        body: formData
    })
    .then(res => res.text())
    .then(msg => {
        alert(msg);
        loadCars();
    });
}

// ==========================
// EDIT CAR
// ==========================

function editCar(id,name,category,price){

    const newName=prompt("Car Name",name);
    if(newName==null) return;

    const newCategory=prompt("Category",category);
    if(newCategory==null) return;

    const newPrice=prompt("Price",price);
    if(newPrice==null) return;

    fetch("/updateCar",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({
            id:id,
            car_name:newName,
            category:newCategory,
            price:newPrice
        })

    })

    .then(res=>res.text())

    .then(msg=>{

        alert(msg);

        loadCars();

    });

}

// ==========================
// DELETE CAR
// ==========================

function deleteCar(id){

    if(!confirm("Delete this car?")) return;

    fetch("/deleteCar",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({
            id:id
        })

    })

    .then(res=>res.text())

    .then(msg=>{

        alert(msg);

        loadCars();

    });

}

// ==========================
// PAGE LOAD
// ==========================

window.onload=function(){

    loadBookings();

    loadCars();

};