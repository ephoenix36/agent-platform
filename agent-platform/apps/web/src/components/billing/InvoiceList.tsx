/**
 * Invoice List Component
 * 
 * Displays billing invoices with download and view functionality
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Download,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar
} from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import type { Invoice } from '@/lib/api';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 10;

export const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchInvoices();
  }, []);

  /**
   * Fetch invoices from API
   */
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.billing.getInvoices(100); // Fetch up to 100 invoices
      
      if (response.success && response.data?.invoices) {
        setInvoices(response.data.invoices);
      } else {
        setError(response.error || 'Failed to load invoices');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get status badge for invoice
   */
  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig: Record<Invoice['status'], { color: string; icon: any; label: string }> = {
      paid: { color: 'bg-green-500 text-white', icon: CheckCircle, label: 'Paid' },
      open: { color: 'bg-blue-500 text-white', icon: Clock, label: 'Open' },
      draft: { color: 'bg-gray-500 text-white', icon: FileText, label: 'Draft' },
      void: { color: 'bg-gray-400 text-white', icon: XCircle, label: 'Void' },
      uncollectible: { color: 'bg-red-500 text-white', icon: XCircle, label: 'Uncollectible' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number, currency: string = 'usd'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Stripe amounts are in cents
  };

  /**
   * Handle download PDF
   */
  const handleDownloadPDF = (invoice: Invoice) => {
    if (invoice.invoice_pdf) {
      window.open(invoice.invoice_pdf, '_blank');
    }
  };

  /**
   * Handle view invoice
   */
  const handleViewInvoice = (invoice: Invoice) => {
    if (invoice.hosted_invoice_url) {
      window.open(invoice.hosted_invoice_url, '_blank');
    }
  };

  /**
   * Pagination
   */
  const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentInvoices = invoices.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
            <p className="text-sm">Your billing invoices will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Billing Invoices</h3>
        </div>
        <Button variant="outline" onClick={fetchInvoices} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Invoice</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Billing Period</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-sm text-gray-900">
                          {invoice.id.substring(0, 12)}...
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {format(new Date(invoice.created), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>
                          {format(new Date(invoice.period_start), 'MMM dd')} - {format(new Date(invoice.period_end), 'MMM dd')}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                      </div>
                      {invoice.amount_paid !== invoice.amount_due && invoice.status !== 'paid' && (
                        <div className="text-xs text-gray-500">
                          Due: {formatCurrency(invoice.amount_due, invoice.currency)}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {invoice.hosted_invoice_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        )}
                        {invoice.invoice_pdf && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPDF(invoice)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            PDF
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {currentInvoices.map((invoice) => (
          <Card key={invoice.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="font-mono text-sm text-gray-900">
                    {invoice.id.substring(0, 12)}...
                  </span>
                </div>
                {getStatusBadge(invoice.status)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{format(new Date(invoice.created), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Period:</span>
                  <span className="font-medium">
                    {format(new Date(invoice.period_start), 'MMM dd')} - {format(new Date(invoice.period_end), 'MMM dd')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">
                    {formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                {invoice.hosted_invoice_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewInvoice(invoice)}
                    className="flex-1"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View
                  </Button>
                )}
                {invoice.invoice_pdf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPDF(invoice)}
                    className="flex-1"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    PDF
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, invoices.length)} of {invoices.length} invoices
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Invoices are generated automatically at the start of each billing period</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Payment is processed automatically using your saved payment method</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Download PDFs for expense reporting and record keeping</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Contact support if you notice any discrepancies in your invoices</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
