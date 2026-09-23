// =========================
// LOAD MY BOOKINGS
// =========================

fetch("http://localhost:3000/mybookings", {
    credentials: "include"
})

.then(res => {

    if (!res.ok) {
        window.location.href = "login.html";
        return;
    }

    return res.json();

})

.then(data => {

    if (!data) return;

    const table = document.getElementById("bookingTable");

    table.innerHTML = `
        <tr>
            <th>Car</th>
            <th>Pickup</th>
            <th>Return</th>
            <th>Total</th>
            <th>Status</th>
            <th>Cancel</th>
        </tr>
    `;

    if (data.length === 0) {

        table.innerHTML += `
            <tr>
                <td colspan="6">
                    No bookings found.
                </td>
            </tr>
        `;

        return;
    }

    data.forEach(booking => {

        table.innerHTML += `
            <tr>

                <td>${booking.car_name}</td>

                <td>
                    ${new Date(booking.pickup_date)
                        .toLocaleDateString("en-GB")}
                </td>

                <td>
                    ${new Date(booking.return_date)
                        .toLocaleDateString("en-GB")}
                </td>

                <td>
                    ₹${booking.total_price}
                </td>

                <td>
                    ${booking.status}
                </td>

                <td>
                    ${
                        booking.status === "Pending"
                        ?
                        `<button onclick="cancelBooking(${booking.id})">
                            Cancel
                        </button>`
                        :
                        "-"
                    }
                </td>

            </tr>
        `;

    });

})

.catch(err => {

    console.error("My Bookings Error:", err);

});


// =========================
// CANCEL BOOKING
// =========================

function cancelBooking(id) {

    if (
        !confirm(
            "Are you sure you want to cancel this booking?"
        )
    ) {
        return;
    }

    fetch(
        "http://localhost:3000/cancel-booking/" + id,
        {
            method: "PUT",
            credentials: "include"
        }
    )

    .then(res => res.text())

    .then(msg => {

        alert(msg);

        location.reload();

    })

    .catch(error => {

        console.error("Cancel Error:", error);

        alert("Cancel Failed");

    });

}