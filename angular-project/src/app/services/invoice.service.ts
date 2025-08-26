import { Injectable } from '@angular/core';
import { OrderDTO } from './order.service';
import { ProductDTO } from './product.service';
import * as html2pdf from 'html2pdf.js';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  readonly DEFAULTS = {
    email: 'nezadany@objednavky.local',
    customerName: 'Nezadany zakaznik',
    address: 'Nezadana adresa',
    city: 'Nezadane mesto',
    postalCode: '00000',
    phoneNumber: '0900000000'
  };

  constructor() { }

  async generateInvoice(order: OrderDTO, selectedProducts: ProductDTO[]): Promise<void> {
    const invoiceHTML = this.buildInvoiceHtml(order, selectedProducts);

    const options = {
      margin: [5, 5, 5, 5],
      filename: `Faktúra_č${order.orderId}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    await html2pdf().set(options).from(invoiceHTML).save();
  }

  async generateInvoices(orders: { order: OrderDTO, products: ProductDTO[] }[]): Promise<void> {
    if (!orders || orders.length === 0) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(
      orders.map(({ order, products }, index) => 
        `<div style="${index > 0 ? 'page-break-before: always;' : ''}">${this.buildInvoiceHtml(order, products)}</div>`
      ).join('')
    );
    doc.close();

    await doc.fonts.ready;

    await Promise.all(Array.from(doc.querySelectorAll('img')).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(res => { img.onload = img.onerror = res; });
    }));

    const options = {
      margin: [5, 5, 5, 5],
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      filename: 'Hromadne_faktury.pdf'
    };

    await html2pdf().set(options).from(doc.body).save();

    iframe.remove();
  }

  private buildInvoiceHtml(order: OrderDTO, selectedProducts: ProductDTO[]): string {
    const hasCompanyData = order.company || order.ico || order.dic;
    const hasInvoiceCompanyData = order.invoiceCompany || order.invoiceICO || order.invoiceDIC;
    const hasInvoiceBasicData = order.invoiceName || order.invoiceEmail || order.invoicePhoneNumber;

    const companyRowHTML = hasCompanyData ? `
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Spoločnosť, IČO, DIČ, IČ DPH</th>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">
          ${order.company || 'Nie je zadané'}, ${order.ico || 'Nie je zadané'}, ${order.dic || 'Nie je zadané'}, ${order.icDph || 'Nie je zadané'}
        </td>
      </tr>` : '';

    const invoiceCompanyRowHTML = hasInvoiceCompanyData ? `
      <tr>
        <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Spoločnosť, IČO, DIČ, IČ DPH</th>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">
          ${order.invoiceCompany || 'Nie je zadané'}, ${order.invoiceICO || 'Nie je zadané'}, ${order.invoiceDIC || 'Nie je zadané'}
        </td>
      </tr>` : '';

    const invoiceDataHTML = hasInvoiceBasicData ? `
      <div style="margin-bottom: 20px;">
        <h3 style="margin-bottom: 10px; font-weight: bold;">Fakturačné údaje</h3>
        <table style="width: 100%; border: 1px solid #e0e0e0;">
          <tr>
            <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Meno a priezvisko</th>
            <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.invoiceName || 'Nie je zadané'}</td>
          </tr>
          ${invoiceCompanyRowHTML}
          <tr>
            <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">E-mail</th>
            <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.invoiceEmail || 'Nie je zadané'}</td>
          </tr>
          <tr>
            <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Tel.č.</th>
            <td style="padding: 8px;">${order.invoicePhoneNumber || 'Nie je zadané'}</td>
          </tr>
        </table>
      </div>` : '';

    return `
      <div style="width: 100%; margin: 10px auto; box-sizing: border-box; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333;">
        <div style="background-color: #e4e4e4ff; padding: 8px; text-align: center; border-bottom: 1px solid #e0e0e0;">
          <h2 style="margin-top: 14px;">Číslo objednávky: <strong>${order.orderId}</strong></h2>
        </div>
        <div style="padding: 20px;">

          <div style="margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0; width: 40%;">Dátum vystavenia faktúry</th>
                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${this.formatDate(order.invoiceIssueDate)}</td>
              </tr>
              <tr>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">Číslo faktúry</th>
                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.invoiceNumber || ''}</td>
              </tr>
              <tr>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">Celkový počet produktov</th>
                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${selectedProducts.reduce((sum, p) => sum + p.productAmount, 0)} ks</td>
              </tr>
              <tr>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e0e0e0;">Celková hmotnosť</th>
                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">1 kg</td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 10px; font-weight: bold;">Objednané produkty</h3>
            <table style="width: 100%; border: 1px solid #e0e0e0;">
              <thead style="background-color: #e4e4e4ff;">
                <tr>
                  <th style="padding: 8px; text-align: left;">Názov produktu</th>
                  <th style="padding: 8px; text-align: center;">Cena/ks</th>
                  <th style="padding: 8px; text-align: center;">Množstvo</th>
                  <th style="padding: 8px; text-align: center;">Celkom (€)</th>
                </tr>
              </thead>
              <tbody>
                ${selectedProducts.map((p, i) => `
                  <tr>
                    <td style="padding: 8px; text-align: left; border-bottom: ${i === selectedProducts.length - 1 ? 'none' : '1px solid #e0e0e0'};">${p.productName}</td>
                    <td style="padding: 8px; text-align: center; border-bottom: ${i === selectedProducts.length - 1 ? 'none' : '1px solid #e0e0e0'};">${p.productPrice} €</td>
                    <td style="padding: 8px; text-align: center; border-bottom: ${i === selectedProducts.length - 1 ? 'none' : '1px solid #e0e0e0'};">${p.productAmount} ks</td>
                    <td style="padding: 8px; text-align: center; border-bottom: ${i === selectedProducts.length - 1 ? 'none' : '1px solid #e0e0e0'};">${(p.productPrice*p.productAmount).toFixed(2)} €</td>
                  </tr>
                `).join('')}
                <tr style="border-top: 1px solid #000; background-color: #f8f9fa;">
                  <td colspan="2" style="padding: 8px; text-align: left;">Zvolený spôsob dopravy</td>
                  <td style="padding: 8px; text-align:center;">Poštovné (${order.deliveryOption}):</td>
                  <td style="padding: 8px; text-align:center;">${order.deliveryCost?.toFixed(2)} €</td>
                </tr>
                <tr style="border-bottom: 1px solid #000; background-color: #f8f9fa;">
                  <td colspan="2" style="padding: 8px; text-align: left;">Zvolený spôsob platby</td>
                  <td style="padding: 8px; text-align:center;">Poplatok za platbu (${order.paymentOption}):</td>
                  <td style="padding: 8px; text-align:center;">${order.paymentCost?.toFixed(2)} €</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 8px; text-align: left;">Celková cena objednávky</td>
                  <td style="padding: 8px; text-align: center; font-weight: bold;">CELKOM:</td>
                  <td style="padding: 8px; text-align: center; font-weight: bold;">
                    ${order.discountAmount > 0
                      ? `${order.totalPrice.toFixed(2)} € <span style="color: #6c757d;">(zľava: -${order.discountAmount}%)</span>`
                      : `${order.totalPrice.toFixed(2)} €`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 10px; font-weight: bold;">Objednávateľ</h3>
            <table style="width: 100%; border: 1px solid #e0e0e0;">
              <tr>
                <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Meno a priezvisko</th>
                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.customerName === this.DEFAULTS.customerName ? 'Nezadané' : order.customerName}</td>
              </tr>
              ${companyRowHTML}
              <tr>
                <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Adresa</th>
                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">
                  ${order.address === this.DEFAULTS.address ? 'Nezadané' : order.address}, 
                  ${order.postalCode === this.DEFAULTS.postalCode ? 'Nezadané' : order.postalCode}, 
                  ${order.city === this.DEFAULTS.city ? 'Nezadané' : order.city}
                </td>
              </tr>
              <tr>
                <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">E-mail</th>
                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.email === this.DEFAULTS.customerName ? 'Nezadané' : order.email}</td>
              </tr>
              <tr>
                <th style="padding: 8px; text-align: left; background-color: #e4e4e4ff;">Tel.č.</th>
                <td style="padding: 8px;">${order.phoneNumber === this.DEFAULTS.phoneNumber ? 'Nezadané' : order.phoneNumber}</td>
              </tr>
            </table>
          </div>

          ${invoiceDataHTML}

        </div>
      </div>`;
  }
  private formatDate(dateString: string): string {
    return dateString ? dateString.split('-').reverse().join('.') : '';
  }
}
