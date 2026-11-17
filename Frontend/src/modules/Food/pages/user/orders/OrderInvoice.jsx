import { useParams, Link } from "react-router-dom"

import { Download, ArrowLeft, FileText, Printer } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import ScrollReveal from "@food/components/user/ScrollReveal"
import { Card, CardHeader, CardTitle, CardContent } from "@food/components/ui/card"
import { Button } from "@food/components/ui/button"
import { Badge } from "@food/components/ui/badge"
import { useOrders } from "@food/context/OrdersContext"
import { useCompanyName } from "@food/hooks/useCompanyName"
import { orderAPI } from "@food/api"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { downloadFile } from "@/shared/utils/downloadUtils"

const money = (v) => Number(v) || 0

/** The app's theme colour (set as --primary on the page), as hex; print and PDF cannot use CSS variables. */
function themeHex() {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    if (/^#[0-9a-f]{6}/i.test(v)) return v.slice(0, 7)
  } catch { /* fall through */ }
  return '#c21919'
}
const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

/** The invoice reads one flat shape; the API order keeps these under pricing / deliveryAddress / payment. */
function toInvoiceOrder(raw) {
  if (!raw) return raw
  const p = raw.pricing || {}
  const addr = raw.deliveryAddress || raw.address || {}
  const items = (raw.items || []).map((i, idx) => ({
    ...i,
    id: i.id || i._id || i.itemId || idx,
    price: money(i.price),
    quantity: Number(i.quantity) || 1,
    variantName: i.variantName || i.size || '',
  }))
  const subtotal = raw.pricing ? money(p.subtotal) : money(raw.subtotal)
  return {
    ...raw,
    id: raw.order_id || raw.id || raw._id,
    status: String(raw.orderStatus || raw.status || '').replace(/_/g, ' '),
    items,
    subtotal,
    tax: raw.pricing ? money(p.tax) : money(raw.tax),
    deliveryFee: raw.pricing ? money(p.deliveryFee) : money(raw.deliveryFee),
    packagingFee: raw.pricing ? money(p.packagingFee) : money(raw.packagingFee),
    platformFee: raw.pricing ? money(p.platformFee) : money(raw.platformFee),
    discount: raw.pricing ? money(p.discount) : money(raw.discount),
    total: raw.pricing ? money(p.total) : money(raw.total),
    address: { street: addr.street || addr.formattedAddress || '', additionalDetails: addr.additionalDetails || '', city: addr.city || '', state: addr.state || '', zipCode: addr.zipCode || addr.pincode || '' },
    paymentMethod: { type: raw.payment?.method || raw.paymentMethod?.type || raw.paymentMethod || 'online' },
  }
}

export default function OrderInvoice() {
  const companyName = useCompanyName()
  const { orderId } = useParams()
  const { getOrderById } = useOrders()
  const [rawOrder, setOrder] = useState(() => getOrderById(orderId))
  const [loading, setLoading] = useState(!rawOrder)
  const [error, setError] = useState(null)
  const invoiceRef = useRef(null)

  useEffect(() => {
    if (rawOrder) return

    const fetchOrder = async () => {
      try {
        setLoading(true)
        const response = await orderAPI.getOrderDetails(orderId)
        if (response.data?.success && response.data.data?.order) {
          setOrder(response.data.data.order)
        } else {
          setError("Order not found")
        }
      } catch (err) {
        setError("Failed to load invoice details")
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, rawOrder])

  if (loading) {
    return (
      <AnimatedPage className="min-h-screen bg-[#F5F3EF] dark:bg-[#0a0a0a] p-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Generating invoice...</p>
        </div>
      </AnimatedPage>
    )
  }

  if (error || !rawOrder) {
    return (
      <AnimatedPage className="min-h-screen bg-[#F5F3EF] dark:bg-[#0a0a0a] p-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">{error || 'Order Not Found'}</h1>
          <Link to="/user/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </AnimatedPage>
    )
  }

  const order = toInvoiceOrder(rawOrder)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    const printContent = invoiceRef.current.innerHTML

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
            }
            .invoice-header {
              border-bottom: 2px solid ${themeHex()};
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .invoice-title {
              font-size: 32px;
              font-weight: bold;
              color: ${themeHex()};
              margin-bottom: 10px;
            }
            .invoice-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 30px 0;
            }
            .invoice-items {
              margin: 30px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #fdecec;
              font-weight: bold;
            }
            .total-section {
              margin-top: 30px;
              text-align: right;
            }
            .total-row {
              padding: 10px 0;
              font-size: 18px;
            }
            .grand-total {
              font-size: 24px;
              font-weight: bold;
              color: ${themeHex()};
              border-top: 2px solid ${themeHex()};
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleDownloadPDF = async () => {
    try {
      const doc = new jsPDF()
      
      // A4 portrait, 15mm margins. The built-in PDF fonts have no rupee sign, so amounts are written "Rs."
      const PAGE_W = doc.internal.pageSize.getWidth()
      const PAGE_H = doc.internal.pageSize.getHeight()
      const M = 15
      const RIGHT = PAGE_W - M
      const theme = hexToRgb(themeHex())
      const rs = (v) => `Rs. ${money(v).toFixed(2)}`

      // Header band
      doc.setFillColor(...theme)
      doc.rect(0, 0, PAGE_W, 28, 'F')
      doc.setTextColor(255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.text("INVOICE", M, 18)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(String(companyName || ''), RIGHT, 18, { align: 'right' })

      // Order details (left) and bill to (right)
      const colTop = 40
      const rightX = PAGE_W / 2 + 5
      doc.setTextColor(0)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text("Order details", M, colTop)
      doc.text("Bill to", rightX, colTop)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(60)
      const payLabel = String(order.paymentMethod?.type || '').replace(/_/g, ' ').toUpperCase()
      const leftLines = [
        `Invoice no: ${order.id}`,
        `Date: ${formatDate(order.createdAt)}`,
        `Status: ${String(order.status).toUpperCase()}`,
        ...(payLabel ? [`Payment: ${payLabel}`] : []),
      ]
      leftLines.forEach((line, k) => doc.text(doc.splitTextToSize(line, PAGE_W / 2 - M - 5), M, colTop + 7 + k * 6))
      const a = order.address || {}
      const addressText = [order.customerName, [a.street, a.additionalDetails].filter(Boolean).join(', '), [a.city, a.state, a.zipCode].filter(Boolean).join(', ')]
        .filter(Boolean).join('\n')
      const addressLines = doc.splitTextToSize(addressText, RIGHT - rightX)
      doc.text(addressLines, rightX, colTop + 7)

      const tableTop = colTop + 7 + Math.max(leftLines.length * 6, addressLines.length * 5) + 8

      // Items
      autoTable(doc, {
        startY: tableTop,
        margin: { left: M, right: M },
        head: [['Item', 'Qty', 'Price', 'Total']],
        body: order.items.map((item) => [
          item.name + (item.variantName && !String(item.name).includes(item.variantName) ? ` (${item.variantName})` : ''),
          String(item.quantity),
          rs(item.price),
          rs(item.price * item.quantity),
        ]),
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 3, textColor: 40 },
        headStyles: { fillColor: theme, textColor: 255 },
        alternateRowStyles: { fillColor: [250, 245, 245] },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { halign: 'center', cellWidth: 16 },
          2: { halign: 'right', cellWidth: 32 },
          3: { halign: 'right', cellWidth: 34 },
        },
        didParseCell: (d) => { if (d.section === 'head' && d.column.index > 0) d.cell.styles.halign = d.column.index === 1 ? 'center' : 'right' },
      })

      // Summary: label left, amount right, in a block on the right half of the page
      const rows = [
        ['Subtotal', rs(order.subtotal)],
        ...(order.packagingFee > 0 ? [['Packaging fee', rs(order.packagingFee)]] : []),
        ...(order.platformFee > 0 ? [['Platform fee', rs(order.platformFee)]] : []),
        ['Delivery fee', rs(order.deliveryFee)],
        ['GST', rs(order.tax)],
        ...(order.discount > 0 ? [['Discount', `- ${rs(order.discount)}`]] : []),
      ]
      let y = (doc.lastAutoTable?.finalY || tableTop) + 10
      if (y + rows.length * 7 + 20 > PAGE_H - 20) { doc.addPage(); y = 25 }
      const labelX = PAGE_W / 2 + 15
      doc.setFontSize(10)
      doc.setTextColor(60)
      rows.forEach(([label, value]) => {
        doc.setFont('helvetica', 'normal')
        doc.text(label, labelX, y)
        doc.text(value, RIGHT, y, { align: 'right' })
        y += 7
      })
      doc.setDrawColor(...theme)
      doc.setLineWidth(0.6)
      doc.line(labelX, y - 2, RIGHT, y - 2)
      y += 5
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(...theme)
      doc.text('Total', labelX, y)
      doc.text(rs(order.total), RIGHT, y, { align: 'right' })

      // Footer on the last page
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(130)
      doc.text('Thank you for your order!', PAGE_W / 2, PAGE_H - 12, { align: 'center' })

      // Use robust download utility
      const pdfBlob = doc.output('blob');
      downloadFile({
        data: pdfBlob,
        filename: `Invoice_${order.id}.pdf`,
        type: 'application/pdf'
      });
      
    } catch (error) {
      console.error("PDF generation error:", error)
      // Fallback to print if PDF generation fails
      handlePrint()
    }
  }

  return (
    <AnimatedPage className="min-h-screen bg-[#F5F3EF] dark:bg-[#0a0a0a] p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link to={`/user/orders/${orderId}`}>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:h-10 sm:w-10">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Invoice</h1>
                <p className="text-muted-foreground text-sm sm:text-base">Order {order.id}</p>
              </div>
            </div>
            <div className="flex gap-2 no-print">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center gap-2 text-xs sm:text-sm h-9 sm:h-10"
              >
                <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button
                onClick={handleDownloadPDF}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] flex items-center gap-2 text-xs sm:text-sm h-9 sm:h-10"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                <span className="hidden sm:inline text-white">Download PDF</span>
                <span className="sm:hidden text-white">PDF</span>
              </Button>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Card ref={invoiceRef} className="dark:bg-[#1a1a1a] dark:border-gray-800">
            <CardContent className="p-4 sm:p-6 md:p-8 lg:p-10">
              {/* Invoice Header */}
              <div className="invoice-header">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--primary)]" />
                  <h2 className="invoice-title text-xl sm:text-2xl md:text-3xl text-[var(--primary)] font-bold">INVOICE</h2>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{companyName}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Food Delivery Platform</p>
                  </div>
                  <Badge className="bg-[var(--primary)] text-white text-sm sm:text-base md:text-lg px-3 sm:px-4 py-1.5 sm:py-2 w-fit">
                    {order.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="invoice-details grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mt-4 sm:mt-6">
                <div>
                  <h3 className="font-bold mb-2 text-sm sm:text-base dark:text-gray-100">Bill To:</h3>
                  <p className="text-xs sm:text-sm dark:text-gray-300">{order.address?.street}</p>
                  {order.address?.additionalDetails && (
                    <p className="text-xs sm:text-sm dark:text-gray-300">{order.address.additionalDetails}</p>
                  )}
                  <p className="text-xs sm:text-sm dark:text-gray-300">
                    {order.address?.city}, {order.address?.state} {order.address?.zipCode}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <h3 className="font-bold mb-2 text-sm sm:text-base dark:text-gray-100">Invoice Details:</h3>
                  <p className="text-xs sm:text-sm dark:text-gray-300"><strong>Invoice #:</strong> {order.id}</p>
                  <p className="text-xs sm:text-sm dark:text-gray-300"><strong>Date:</strong> {formatDate(order.createdAt)}</p>
                  <p className="text-xs sm:text-sm dark:text-gray-300"><strong>Payment:</strong> {order.paymentMethod?.type?.toUpperCase() || "Card"}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="invoice-items mt-4 sm:mt-6">
                <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base dark:text-gray-100">Order Items:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm dark:text-gray-300">
                    <thead>
                      <tr className="border-b dark:border-gray-800">
                        <th className="px-2 sm:px-3 py-2 text-left dark:text-gray-200">Item</th>
                        <th className="px-2 sm:px-3 py-2 text-center hidden sm:table-cell dark:text-gray-200">Quantity</th>
                        <th className="px-2 sm:px-3 py-2 text-right hidden md:table-cell dark:text-gray-200">Unit Price</th>
                        <th className="px-2 sm:px-3 py-2 text-right dark:text-gray-200">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-b dark:border-gray-800">
                          <td className="px-2 sm:px-3 py-2 sm:py-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-8 h-8 sm:w-12 sm:h-12 object-cover rounded flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="font-medium block dark:text-gray-100">{item.name}</span>
                                {item.variantName ? (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{item.variantName}</span>
                                ) : null}
                                <span className="text-muted-foreground sm:hidden text-xs">
                                  Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 sm:py-3 text-center hidden sm:table-cell dark:text-gray-100">{item.quantity}</td>
                          <td className="px-2 sm:px-3 py-2 sm:py-3 text-right hidden md:table-cell dark:text-gray-100">₹{item.price.toFixed(2)}</td>
                          <td className="px-2 sm:px-3 py-2 sm:py-3 text-right font-medium dark:text-gray-100">₹{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Section */}
              <div className="total-section mt-4 sm:mt-6">
                <div className="total-row flex justify-between text-xs sm:text-sm sm:text-base py-1 sm:py-2 dark:text-gray-300">
                  <span>Subtotal:</span>
                  <span>₹{order.subtotal.toFixed(2)}</span>
                </div>
                {order.packagingFee > 0 && (
                  <div className="total-row flex justify-between text-xs sm:text-sm sm:text-base py-1 sm:py-2 dark:text-gray-300">
                    <span>Packaging Fee:</span>
                    <span>₹{order.packagingFee.toFixed(2)}</span>
                  </div>
                )}
                {order.platformFee > 0 && (
                  <div className="total-row flex justify-between text-xs sm:text-sm sm:text-base py-1 sm:py-2 dark:text-gray-300">
                    <span>Platform Fee:</span>
                    <span>₹{order.platformFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="total-row flex justify-between text-xs sm:text-sm sm:text-base py-1 sm:py-2 dark:text-gray-300">
                  <span>Delivery Fee:</span>
                  <span>₹{order.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="total-row flex justify-between text-xs sm:text-sm sm:text-base py-1 sm:py-2 dark:text-gray-300">
                  <span>GST:</span>
                  <span>₹{order.tax.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="total-row flex justify-between text-xs sm:text-sm sm:text-base py-1 sm:py-2 text-green-600 dark:text-green-400">
                    <span>Discount:</span>
                    <span>-₹{order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="grand-total flex justify-between text-base sm:text-lg md:text-xl md:text-2xl pt-2 sm:pt-3 mt-2 sm:mt-3 border-t-2 border-[var(--primary)] dark:text-gray-100">
                  <span>Total:</span>
                  <span>₹{order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t dark:border-gray-800 text-center text-xs sm:text-sm text-muted-foreground">
                <p className="dark:text-gray-400">Thank you for your order!</p>
                <p className="mt-1 sm:mt-2 dark:text-gray-400">For any queries, please contact our support team.</p>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 no-print">
            <Link to="/user/orders" className="flex-1">
              <Button variant="outline" className="w-full text-sm sm:text-base h-10 sm:h-11">
                Back to Orders
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </AnimatedPage>
  )
}
