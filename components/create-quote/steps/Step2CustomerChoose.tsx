"use client";

import type { FC, Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Eye, Search, X, Edit, FileText, Calendar, DollarSign } from "lucide-react";
import { useState } from "react";
import type { QuoteFormData } from "@/types";

interface Step2Props {
  formData: QuoteFormData;
  setFormData: Dispatch<SetStateAction<QuoteFormData>>;
}

// Mock existing customers database with quote information
const EXISTING_CUSTOMERS = [
  {
    id: "CUST001",
    company: "Eagan Inc.",
    contactPerson: "John Smith",
    email: "john.smith@eagan.com",
    phone: "+971-50-123-4567",
    quoteId: "Q001",
    quoteAmount: "$2,500",
    quoteDate: "2024-01-15",
    quoteStatus: "Sent",
    quoteItems: [
      { item: "Business Cards", quantity: "1000", price: "$800" },
      { item: "Letterheads", quantity: "500", price: "$600" },
      { item: "Envelopes", quantity: "1000", price: "$1,100" }
    ]
  },
  {
    id: "CUST002",
    company: "Tech Solutions Ltd.",
    contactPerson: "Sarah Johnson",
    email: "sarah.j@techsolutions.com",
    phone: "+971-55-987-6543",
    quoteId: "Q002",
    quoteAmount: "$4,200",
    quoteDate: "2024-01-20",
    quoteStatus: "Accepted",
    quoteItems: [
      { item: "Brochures", quantity: "2000", price: "$1,800" },
      { item: "Flyers", quantity: "5000", price: "$1,200" },
      { item: "Posters", quantity: "100", price: "$1,200" }
    ]
  },
  {
    id: "CUST003",
    company: "Global Print Corp.",
    contactPerson: "Michael Brown",
    email: "michael.b@globalprint.com",
    phone: "+971-52-456-7890",
    quoteId: "Q003",
    quoteAmount: "$1,800",
    quoteDate: "2024-01-25",
    quoteStatus: "Sent",
    quoteItems: [
      { item: "Business Cards", quantity: "500", price: "$400" },
      { item: "Notepads", quantity: "100", price: "$800" },
      { item: "Stickers", quantity: "200", price: "$600" }
    ]
  },
  {
    id: "CUST004",
    company: "Creative Agency",
    contactPerson: "Lisa Wilson",
    email: "lisa.w@creativeagency.com",
    phone: "+971-54-321-0987",
    quoteId: "Q004",
    quoteAmount: "$3,100",
    quoteDate: "2024-01-30",
    quoteStatus: "Draft",
    quoteItems: [
      { item: "Catalogs", quantity: "500", price: "$2,000" },
      { item: "Business Cards", quantity: "1000", price: "$800" },
      { item: "Envelopes", quantity: "500", price: "$300" }
    ]
  },
  {
    id: "CUST005",
    company: "Marketing Pro",
    contactPerson: "David Lee",
    email: "david.lee@marketingpro.com",
    phone: "+971-56-789-0123",
    quoteId: "Q005",
    quoteAmount: "$2,900",
    quoteDate: "2024-02-01",
    quoteStatus: "Rejected",
    quoteItems: [
      { item: "Banners", quantity: "5", price: "$1,500" },
      { item: "Flyers", quantity: "3000", price: "$900" },
      { item: "Business Cards", quantity: "500", price: "$500" }
    ]
  }
];

const Step2CustomerChoose: FC<Step2Props> = ({ formData, setFormData }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showList, setShowList] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<typeof EXISTING_CUSTOMERS[0] | null>(null);

  const filteredCustomers = EXISTING_CUSTOMERS.filter(customer =>
    customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    
    // Find the selected customer and update form data
    const selectedCustomer = EXISTING_CUSTOMERS.find(c => c.id === customerId);
    if (selectedCustomer) {
      setFormData(prev => ({
        ...prev,
        client: {
          ...prev.client,
          companyName: selectedCustomer.company,
          firstName: selectedCustomer.contactPerson.split(' ')[0] || '',
          lastName: selectedCustomer.contactPerson.split(' ').slice(1).join(' ') || '',
          email: selectedCustomer.email,
          phone: selectedCustomer.phone.replace('+971-', ''), // Remove country code for form
        }
      }));
    }
  };

  const handleViewQuote = (customer: typeof EXISTING_CUSTOMERS[0], event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleEditQuote = (customer: typeof EXISTING_CUSTOMERS[0], event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const isSelectionValid = selectedCustomerId !== "";

  return (
    <div className="space-y-6">
      {/* Page Title - Changed to "Select Quote" as per revision */}
      <div className="text-center">
        <h2 className="font-bold text-3xl text-gray-900">Select Quote</h2>
        <p className="text-gray-600 mt-2">Review and modify customer details from the selected template</p>
      </div>

      {/* Select Existing Customer Section - White card container */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Select Existing Customer</h4>
          <Button
            variant="outline"
            onClick={() => setShowList(!showList)}
            className="px-4 py-2"
          >
            {showList ? "Hide List" : "Show List"}
          </Button>
        </div>

        {showList && (
          <>
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by customer name, company, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Customer Table - Removed SELECT column, made rows clickable */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Person
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedCustomerId === customer.id ? 'bg-blue-50 ring-2 ring-blue-200' : ''
                      }`}
                      onClick={() => handleCustomerSelect(customer.id)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {customer.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {customer.company}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {customer.contactPerson}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {customer.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {customer.phone}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => handleViewQuote(customer, e)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            title="View Quote"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleEditQuote(customer, e)}
                            className="text-green-600 hover:text-green-800 transition-colors p-2 rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            title="Edit Quote"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* No Results Message */}
            {filteredCustomers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No customers found matching your search criteria.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Selection Status */}
      {selectedCustomerId && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <p className="text-green-700 font-medium">
              Quote selected successfully. You can now proceed to the next step.
            </p>
          </div>
        </div>
      )}

      {/* No Selection Warning */}
      {!selectedCustomerId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <p className="text-yellow-700 font-medium">
              Please select a quote to proceed to the next step.
            </p>
          </div>
        </div>
      )}

      {/* View Quote Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Quote Details - {selectedCustomer?.quoteId}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Quote Header */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Quote ID:</span>
                    <span className="font-medium text-gray-900">{selectedCustomer.quoteId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Quote Date:</span>
                    <span className="font-medium text-gray-900">{selectedCustomer.quoteDate}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="font-bold text-lg text-blue-600">{selectedCustomer.quoteAmount}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedCustomer.quoteStatus === 'Accepted' ? 'bg-green-100 text-green-800' :
                      selectedCustomer.quoteStatus === 'Sent' ? 'bg-blue-100 text-blue-800' :
                      selectedCustomer.quoteStatus === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedCustomer.quoteStatus}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-gray-600">Company:</span>
                    <span className="font-medium text-gray-900 ml-2">{selectedCustomer.company}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Contact:</span>
                    <span className="font-medium text-gray-900 ml-2">{selectedCustomer.contactPerson}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900 ml-2">{selectedCustomer.email}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900 ml-2">{selectedCustomer.phone}</span>
                  </div>
                </div>
              </div>

              {/* Quote Items */}
              <div>
                <h5 className="text-md font-semibold text-gray-900 mb-3">Quote Items</h5>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {selectedCustomer.quoteItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{item.item}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-600">Qty: {item.quantity}</span>
                          <span className="font-medium text-gray-900">{item.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-lg text-blue-600">{selectedCustomer.quoteAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Quote Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="w-5 h-5 mr-2 text-blue-600" />
              Edit Quote - {selectedCustomer?.quoteId}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Information Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <Input
                      value={selectedCustomer.company}
                      onChange={(e) => {
                        // In a real app, you'd update the state here
                        console.log("Company updated:", e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <Input
                      value={selectedCustomer.contactPerson}
                      onChange={(e) => {
                        console.log("Contact updated:", e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input
                      type="email"
                      value={selectedCustomer.email}
                      onChange={(e) => {
                        console.log("Email updated:", e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <Input
                      value={selectedCustomer.phone}
                      onChange={(e) => {
                        console.log("Phone updated:", e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Quote Details Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Quote Details</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quote Date</label>
                    <Input
                      type="date"
                      value={selectedCustomer.quoteDate}
                      onChange={(e) => {
                        console.log("Date updated:", e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={selectedCustomer.quoteStatus}
                      onChange={(e) => {
                        console.log("Status updated:", e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                    <Input
                      value={selectedCustomer.quoteAmount}
                      onChange={(e) => {
                        console.log("Amount updated:", e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Quote Items Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Quote Items</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // In a real app, you'd add a new item here
                      console.log("Add new item clicked");
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    + Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {selectedCustomer.quoteItems.map((item, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-gray-200">
                      <div className="grid md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Item</label>
                          <Input
                            value={item.item}
                            onChange={(e) => {
                              console.log(`Item ${index} updated:`, e.target.value);
                            }}
                            className="w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                          <Input
                            value={item.quantity}
                            onChange={(e) => {
                              console.log(`Quantity ${index} updated:`, e.target.value);
                            }}
                            className="w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                          <Input
                            value={item.price}
                            onChange={(e) => {
                              console.log(`Price ${index} updated:`, e.target.value);
                            }}
                            className="w-full text-sm"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log(`Remove item ${index}`);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Notes Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Additional Notes</h4>
                <textarea
                  placeholder="Add any additional notes, special requirements, or comments..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  onChange={(e) => {
                    console.log("Notes updated:", e.target.value);
                  }}
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // In a real app, you'd save the changes here
                console.log("Saving changes...");
                setShowEditModal(false);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Step2CustomerChoose;