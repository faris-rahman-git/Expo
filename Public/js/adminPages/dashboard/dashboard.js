window.addEventListener("load", () => {
  document.getElementById("custom").value = "Daily";
  userFilterFunction();
  salesFilterFunction();
});

let customUser = false;
function customUserBtn() {
  const customUserToDate = document.getElementById("customUserToDate");
  const customUserFromDate = document.getElementById("customUserFromDate");
  if (customUserToDate.value == "" || customUserFromDate.value == "") {
    document.getElementById("logErrorMessage").textContent =
      "Please Select Date";
    return false;
  }
  document.getElementById("customUserBtnId").dataset.dismiss = "modal";

  customUser = true;
  userFilterFunction();
}

async function userFilterFunction() {
  const custom = document.getElementById("custom").value;
  if (custom == "Custom" && !customUser) {
    document.getElementById("customBtn").style.display = "block";
  } else {
    if (customUser) {
      customUser = false;
    } else {
      document.getElementById("customBtn").style.display = "none";
    }
    const url = "/admin/dashboard/userFilter/" + custom;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: document.getElementById("customUserFromDate").value,
        endDate: document.getElementById("customUserToDate").value,
      }),
    });

    const responseData = await response.json();
    if (responseData.success) {
      // Update UI Counts
      document.getElementById("totalUser").innerText = responseData.TotalUsers;
      document.getElementById("newUser").innerText = responseData.newUsers;

      // Store values properly
      const totalUsersArr = responseData.totalUsersArr; // Already an array
      const newUsersArr = responseData.newUsersArr; // Already an array
      const dateArr = responseData.dateArr; // Already an array

      // Update Chart
      updateChart(dateArr, totalUsersArr, newUsersArr);
    }
  }
}

let userChart = null;

function updateChart(dates, totalUsers, newUsers) {
  if (userChart) {
    userChart.destroy(); // Destroy the existing chart before re-rendering
  }

  var options = {
    chart: {
      height: 230,
      type: "bar",
      shadow: {
        enabled: true,
        color: "#000",
        top: 18,
        left: 7,
        blur: 10,
        opacity: 1,
      },
      toolbar: {
        show: false,
      },
    },
    colors: ["#1e00f7", "#9b9ba2"],
    dataLabels: {
      enabled: true,
    },
    stroke: {
      curve: "smooth",
    },
    series: [
      {
        name: "Total Users",
        data: totalUsers,
      },
      {
        name: "New Users",
        data: newUsers,
      },
    ],
    grid: {
      borderColor: "#e7e7e7",
      row: {
        colors: ["#", "transparent"],
        opacity: 0.0,
      },
    },
    markers: {
      size: 4,
    },
    xaxis: {
      categories: dates, // Use the date array from API response
      labels: {
        style: {
          colors: "#9aa0ac",
        },
      },
    },
    yaxis: {
      title: {
        text: "Count",
      },
      labels: {
        style: {
          color: "#9aa0ac",
        },
      },
      min: 0,
      max: Math.max(...totalUsers, ...newUsers),
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      floating: true,
      offsetY: -25,
      offsetX: -5,
    },
  };

  userChart = new ApexCharts(document.querySelector("#chart1"), options);
  userChart.render();
}

let customSales = false;
function customSalesBtn() {
  const customSalesFromDate = document.getElementById("customSalesFromDate");
  const customSalesToDate = document.getElementById("customSalesToDate");
  if (customSalesToDate.value == "" || customSalesFromDate.value == "") {
    document.getElementById("logErrorMessageSales").textContent =
      "Please Select Date";
    return false;
  }
  document.getElementById("customSalesBtnId").dataset.dismiss = "modal";

  customSales = true;
  salesFilterFunction();
}

async function salesFilterFunction() {
  try {
    const customSalesFilter =
      document.getElementById("customSalesFilter").value;
    if (customSalesFilter == "Custom" && !customSales) {
      document.getElementById("customSalesFilterBtn").style.display = "block";
    } else {
      if (customSales) {
        customSales = false;
      } else {
        document.getElementById("customSalesFilterBtn").style.display = "none";
        document.getElementById("customSalesFromDate").value = "";
        document.getElementById("customSalesToDate").value = "";
      }
      const url = `/admin/dashboard/salesFilter/${customSalesFilter}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: document.getElementById("customSalesFromDate").value,
          endDate: document.getElementById("customSalesToDate").value,
        }),
      });
      const responseData = await response.json();

      if (responseData.success) {
        // Update UI Counts
        document.getElementById("totalOrders").innerText =
          responseData.totalOrders;
        document.getElementById("totalSales").innerText =
          "$" + responseData.totalRevenue.toFixed(2);
        document.getElementById("digitalOrders").innerText =
          responseData.digitalOrdersCount;
        document.getElementById("digitalSales").innerText =
          "$" + responseData.digitalOrdersAmount.toFixed(2);
        document.getElementById("CODOrders").innerText =
          responseData.CODOrdersCount;
        document.getElementById("CODSales").innerText =
          "$" + responseData.CODOrdersAmount.toFixed(2);

        // Ensure salesData exists before accessing properties
        const dateArr = responseData.dateArr;
        const totalRevenueArr = responseData.totalRevenueArr;
        const CODAmountArr = responseData.CODAmountArr;
        const digitalAmountArr = responseData.digitalAmountArr;
        const filter = responseData.filter;

        // Update Chart
        updateSalesChart(
          dateArr,
          totalRevenueArr,
          CODAmountArr,
          digitalAmountArr,
          filter
        );
      }
    }
  } catch (error) {
    console.error("Error fetching sales data:", error);
  }
}

let salesChart = null;
const customSalesFilter = document.getElementById("customSalesFilter").value;

function updateSalesChart(
  dates,
  totalRevenue,
  CODAmount,
  digitalAmount,
  filter
) {
  if (salesChart) {
    salesChart.destroy();
  }

  filter = dates.length == 1 ? "Daily" : filter;

  var options = {
    chart: {
      height: 250,
      type: filter == "Daily" ? "bar" : "area",
      toolbar: { show: false },
    },
    colors: ["#FF5733", "#4CC2B0", "#F4D03F"],
    fill: { colors: ["#FF5733", "#4CC2B0", "#F4D03F"] },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" },
    markers: { colors: ["#FF5733", "#4CC2B0", "#F4D03F"] },
    series: [
      { name: "Total Revenue", data: totalRevenue },
      { name: "COD Revenue", data: CODAmount },
      { name: "Digital Revenue", data: digitalAmount },
    ],
    legend: { show: true },
    xaxis: {
      categories: dates,
      labels: { style: { colors: "#9aa0ac" } },
    },
    yaxis: {
      labels: { style: { color: "#9aa0ac" } },
    },
  };

  // Ensure #chart4 exists before rendering
  const chartElement = document.querySelector("#chart4");
  salesChart = new ApexCharts(chartElement, options);
  salesChart.render();
}
