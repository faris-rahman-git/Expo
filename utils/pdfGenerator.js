const PDFDocument = require("pdfkit");
const moment = require("moment");

const generateInvoicePDF = (fullOrder, order, res) => {
  return new Promise((resolve, reject) => {
    try {
      if (!order) {
        return reject(new Error("Order data is missing"));
      }

      const doc = new PDFDocument({ margin: 50 });

      // Set response headers for inline display
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=invoice_${order._id}.pdf`
      );
      doc.pipe(res);

      // **Header**
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("Invoice", { align: "center" })
        .moveDown();

      // **Invoice Metadata**
      doc
        .fontSize(12)
        .font("Helvetica")
        .text(`Invoice Number:`, { align: "right" })
        .text(`# ORD-${order._id || "N/A"}`, { align: "right" })
        .text(
          `Order Date: ${
            moment(fullOrder.orderDate).format("MMMM D, YYYY") || "N/A"
          }`,
          { align: "right" }
        )
        .text(
          `Delivery Date: ${
            moment(order.deliveredAt).format("MMMM D, YYYY") || "N/A"
          }`,
          { align: "right" }
        )
        .text(`Payment Method: ${fullOrder.paymentDetails?.method || "N/A"}`, {
          align: "right",
        })
        .moveDown();

      // **Billing & Shipping Details (Optional Chaining to Prevent Errors)**
      doc
        .text("Billed To:", { bold: true })
        .text("Xpo Ecom")
        .text("Celembra , Malappuram , 673634")
        .text("Kerala , India")
        .moveDown()
        .text("Shipped To:", { bold: true })
        .text(fullOrder.shippingAddress?.fullName || "N/A")
        .text(fullOrder.shippingAddress?.phoneNumber || "N/A")
        .text(fullOrder.shippingAddress?.house || "N/A")
        .text(fullOrder.shippingAddress?.street || "N/A")
        .text(fullOrder.shippingAddress?.landmark || "N/A")
        .text(fullOrder.shippingAddress?.city + ",Kerala, India " || "N/A")
        .moveDown();

      // **Table Headers**
      const tableTop = 370;
      const itemX = 50,
        priceX = 300,
        qtyX = 400,
        totalX = 500;

      doc.font("Helvetica-Bold").fontSize(12);
      doc.text("#", itemX, tableTop);
      doc.text("Item", itemX + 20, tableTop);
      doc.text("Price", priceX, tableTop);
      doc.text("Quantity", qtyX, tableTop);
      doc.text("Total", totalX, tableTop);
      doc.moveDown();

      const price = order.price;

      // **Table Rows**
      let yPos = tableTop + 20;
      doc.font("Helvetica").fontSize(11);

      doc.text(1, itemX, yPos);
      doc.text(order.productId?.productName || "N/A", itemX + 20, yPos);
      doc.text(`${order.price?.toFixed(2) || "0.00"}`, priceX, yPos);
      doc.text(order.quantity || "N/A", qtyX, yPos);
      doc.text(
        `${(order.price * order.quantity)?.toFixed(2) || "0.00"}`,
        totalX,
        yPos
      );
      yPos += 20;

      const total =
        order.price * order.quantity -
        (order.couponDiscount + order.offerDiscount) +
        order.shippingCost;

      doc.moveDown().moveDown();
      // **Total Summary**
      doc
        .fontSize(12)
        .text(
          `Subtotal: + ${(order.price * order.quantity)?.toFixed(2) || "0.00"}`,
          totalX - 50,
          yPos + 20,
          { align: "right" }
        )
        .moveDown();
      doc
        .fontSize(12)
        .text(
          `Discount: - ${
            (order.couponDiscount + order.offerDiscount)?.toFixed(2) || "0.00"
          }`,
          totalX - 50,
          yPos + 40,
          { align: "right" }
        );
      doc.text(
        `Shipping: + ${order.shippingCost?.toFixed(2) || "0.00"}`,
        totalX - 50,
        yPos + 60,
        { align: "right" }
      );
      doc
        .font("Helvetica-Bold")
        .text(`Total: ${total?.toFixed(2) || "0.00"}`, totalX - 50, yPos + 80, {
          align: "right",
        });

      doc.end();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generateInvoicePDF;
