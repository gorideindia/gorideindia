fetch("/mybookings")

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

    table.innerHTML = "";

    data.forEach(booking => {

        table.innerHTML += `
        <tr>

            <td>${booking.car_name}</td>

            <td>${new Date(booking.pickup_date).toLocaleDateString("en-GB")}
           
            </td>
>${new Date(booking.return_date).toLocaleDateString("en-GB")}</td>

            

            <td>₹${booking.total_price}</td>

            <td>${booking.status}</td>

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

.catch(err => console.log(err));

function cancelBooking(id) {

    if (!confirm("Are you sure you want to cancel this booking?")) return;

    fetch("/cancel-booking/" + id, {
        method: "PUT"
    })

    .then(res => res.text())

    .then(msg => {
        alert(msg);
        location.reload();
    })

    .catch(() => {
        alert("Cancel Failed");
    });

}