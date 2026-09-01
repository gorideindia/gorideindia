// ===============================
// GoRide Admin - admin.js
// ===============================


// ===============================
// LOAD BOOKINGS
// ===============================

async function loadBookings() {

    try {

        const response = await fetch("/bookings");

        const data = await response.json();

        if (!response.ok || !Array.isArray(data)) {
            throw new Error("Unable to load bookings");
        }

        const table = document.getElementById("bookingTable");

        if (!table) return;

        table.innerHTML = "";

        data.forEach(booking => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${booking.id}</td>

                <td>${escapeHTML(booking.customer_name)}</td>

                <td>${escapeHTML(booking.mobile)}</td>

                <td>${escapeHTML(booking.car_name)}</td>

                <td>${formatDate(booking.pickup_date)}</td>

                <td>${formatDate(booking.return_date)}</td>

                <td>₹${Number(booking.total_price || 0).toLocaleString("en-IN")}</td>

                <td>
                    ${escapeHTML(booking.status || "Pending")}
                </td>

                <td>
                    <button
                        class="delete"
                        onclick="deleteBooking(${booking.id})">
                        Delete
                    </button>
                </td>
            `;

            table.appendChild(row);

        });

    } catch (error) {

        console.error("Load Bookings Error:", error);

        alert("Unable to load bookings.");

    }

}


// ===============================
// DELETE BOOKING
// ===============================

async function deleteBooking(id) {

    if (!confirm("Delete this booking?")) {
        return;
    }

    try {

        const response = await fetch("/deleteBooking", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                id: id
            })

        });

        const data = await response.json();

        if (!response.ok || !data.success) {

            alert(
                data.message ||
                "Booking delete failed."
            );

            return;
        }

        alert("Booking deleted successfully.");

        loadBookings();
        loadDashboard();

    } catch (error) {

        console.error("Delete Booking Error:", error);

        alert("Unable to delete booking.");

    }

}


// ===============================
// DASHBOARD
// ===============================

async function loadDashboard() {

    try {

        const response = await fetch("/dashboard");

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Dashboard error"
            );
        }

        const totalBookings =
            document.getElementById("totalBookings");

        const totalCars =
            document.getElementById("totalCars");

        const bookedCars =
            document.getElementById("bookedCars");

        const totalRevenue =
            document.getElementById("totalRevenue");


        if (totalBookings) {
            totalBookings.innerText =
                data.totalBookings || 0;
        }

        if (totalCars) {
            totalCars.innerText =
                data.totalCars || 0;
        }

        if (bookedCars) {
            bookedCars.innerText =
                data.bookedCars || 0;
        }

        if (totalRevenue) {
            totalRevenue.innerText =
                "₹" +
                Number(data.revenue || 0)
                    .toLocaleString("en-IN");
        }

    } catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

    }

}


// ===============================
// LOAD CARS
// ===============================

async function loadCars() {

    try {

        const response = await fetch("/cars");

        const data = await response.json();

        if (
            !response.ok ||
            !Array.isArray(data)
        ) {
            throw new Error(
                "Unable to load cars"
            );
        }

        const table =
            document.getElementById("carTable");

        if (!table) return;

        table.innerHTML = "";


        data.forEach(car => {

            const row =
                document.createElement("tr");

            const imageName =
                car.image || "";

            const imageHTML =
                imageName
                    ? `
                        <img
                            src="/images/${encodeURIComponent(imageName)}"
                            width="100"
                            height="60"
                            style="
                                object-fit:cover;
                                border-radius:8px;
                            "
                            alt="${escapeHTML(car.car_name)}"
                            onerror="this.style.display='none';"
                        >
                    `
                    : "No Image";


            row.innerHTML = `

                <td>${car.id}</td>

                <td>
                    ${imageHTML}
                </td>

                <td>
                    ${escapeHTML(car.car_name)}
                </td>

                <td>
                    ${escapeHTML(car.category)}
                </td>

                <td>
                    ₹${Number(car.price || 0)
                        .toLocaleString("en-IN")}
                </td>

                <td>

                    <button
                        class="edit"
                        onclick="editCar(
                            ${car.id},
                            '${escapeJS(car.car_name)}',
                            '${escapeJS(car.category)}',
                            ${Number(car.price || 0)}
                        )">
                        Edit
                    </button>

                    <button
                        class="delete"
                        onclick="deleteCar(${car.id})">
                        Delete
                    </button>

                </td>

            `;

            table.appendChild(row);

        });

    } catch (error) {

        console.error(
            "Load Cars Error:",
            error
        );

        alert("Unable to load cars.");

    }

}


// ===============================
// ADD CAR
// ===============================

async function addCar() {

    const carName =
        document.getElementById("carName")?.value.trim();

    const category =
        document.getElementById("category")?.value.trim();

    const price =
        document.getElementById("price")?.value.trim();

    const image =
        document.getElementById("image")?.files[0];


    if (!carName) {

        alert("Please enter car name.");

        return;
    }

    if (!category) {

        alert("Please enter category.");

        return;
    }

    if (!price || Number(price) <= 0) {

        alert("Please enter valid price.");

        return;
    }


    const formData =
        new FormData();

    formData.append(
        "car_name",
        carName
    );

    formData.append(
        "category",
        category
    );

    formData.append(
        "price",
        price
    );


    if (image) {

        formData.append(
            "image",
            image
        );

    }


    try {

        const response =
            await fetch("/addCar", {

                method: "POST",

                body: formData

            });


        const text =
            await response.text();


        if (!response.ok) {

            alert(
                text ||
                "Add car failed."
            );

            return;
        }


        alert(
            text ||
            "Car added successfully."
        );


        document.getElementById(
            "carName"
        ).value = "";

        document.getElementById(
            "category"
        ).value = "";

        document.getElementById(
            "price"
        ).value = "";

        document.getElementById(
            "image"
        ).value = "";


        loadCars();
        loadDashboard();


    } catch (error) {

        console.error(
            "Add Car Error:",
            error
        );

        alert(
            "Unable to add car."
        );

    }

}


// ===============================
// EDIT CAR
// ===============================

async function editCar(
    id,
    name,
    category,
    price
) {

    const newName =
        prompt(
            "Car Name:",
            name
        );

    if (newName === null) {
        return;
    }


    const newCategory =
        prompt(
            "Category:",
            category
        );

    if (newCategory === null) {
        return;
    }


    const newPrice =
        prompt(
            "Price:",
            price
        );

    if (newPrice === null) {
        return;
    }


    if (
        !newName.trim() ||
        !newCategory.trim() ||
        !newPrice ||
        Number(newPrice) <= 0
    ) {

        alert(
            "Please enter valid car details."
        );

        return;
    }


    try {

        const response =
            await fetch(
                "/updateCar",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        id: id,

                        car_name:
                            newName.trim(),

                        category:
                            newCategory.trim(),

                        price:
                            Number(newPrice)

                    })

                }
            );


        const text =
            await response.text();


        if (!response.ok) {

            alert(
                text ||
                "Car update failed."
            );

            return;
        }


        alert(
            text ||
            "Car updated successfully."
        );


        loadCars();
        loadDashboard();


    } catch (error) {

        console.error(
            "Update Car Error:",
            error
        );

        alert(
            "Unable to update car."
        );

    }

}


// ===============================
// DELETE CAR
// ===============================

async function deleteCar(id) {

    if (
        !confirm(
            "Delete this car?"
        )
    ) {

        return;
    }


    try {

        const response =
            await fetch(
                "/deleteCar",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        id: id
                    })

                }
            );


        const text =
            await response.text();


        if (!response.ok) {

            alert(
                text ||
                "Car delete failed."
            );

            return;
        }


        alert(
            text ||
            "Car deleted successfully."
        );


        loadCars();
        loadDashboard();


    } catch (error) {

        console.error(
            "Delete Car Error:",
            error
        );

        alert(
            "Unable to delete car."
        );

    }

}


// ===============================
// DATE FORMAT
// ===============================

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const date =
        new Date(dateValue);

    if (isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString(
        "en-GB"
    );

}


// ===============================
// SECURITY HELPERS
// ===============================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeJS(value) {

    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");

}


// ===============================
// PAGE LOAD
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadDashboard();

        loadBookings();

        loadCars();

    }
);


// ===============================
// EXPORT FUNCTIONS
// ===============================

window.addCar =
    addCar;

window.editCar =
    editCar;

window.deleteCar =
    deleteCar;

window.deleteBooking =
    deleteBooking;

window.loadBookings =
    loadBookings;

window.loadCars =
    loadCars;

window.loadDashboard =
    loadDashboard;