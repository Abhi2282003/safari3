# Royal Safari

Build a single-user “Manual Bus Ticket Booking” system for an offline booking office.
No multiple users, no login, no roles. Only one operator uses the app.

1) Main Goal

I should be able to create a manual ticket by entering passenger + tour details, then print a ticket in the same format as the attached ticket image:

Left side = Main Ticket

Right side = Boarding Pass

System must maintain daily ticket record visible on dashboard.

Every ticket must have a unique Ticket No / Ticket ID auto-generated.

Each ticket must track Collection Paid = Yes/No.

If paid, select “Paid/Received By” from a dropdown list of names (I will manage this list).

2) Ticket Layout (Match Attached Ticket)
A) Company Header (Editable in Settings)

Company Name (example: “ROYAL … Pune”)

Address line

Phone numbers

Optional logo image

B) Main Ticket (Left Portion) – Fields

Create “New Ticket” form that fills these print fields:

Ticket No. (auto generated, big and clear)

T.No / Serial No (same as Ticket No OR separate auto serial)

Shri/Smt (Passenger Name) (required)

“with Family/Friends” (optional checkbox/text)

Tours To (Destination/Route) (required)

Journey Date (required)

Booking Date (auto = today, but editable)

Address (optional)

Phone (required)

No. of Tourist (required)

Seat No. (optional)

Rep. Time (optional)

Dep. Time (optional)

Amount Rs. (auto from total amount)

Sig. of Tourist (leave blank line for signature on print)

PNR No. (optional)

Bus No. (optional)

Branch (optional)

C) Boarding Pass (Right Portion) – Fields

Print a detachable “BOARDING PASS” section with:

T.No.

Shri/Smt (Passenger Name)

Tours To

Seat No

Date

Dep. Time

₹ Amount

Signature line

Footer note: “Wish you a Happy Journey” (editable)

D) Printing Requirements

Print should look like a ticket booklet style:

Two panels in one page (Main Ticket + Boarding Pass).

Provide 2 print modes:

A4 print (Landscape) with both panels side-by-side.

Thermal 80mm (optional): print Main Ticket first then Boarding Pass below (if thermal selected).

Add a Print button on Ticket Details page and after saving.

3) Ticket ID / Ticket Number Rules (Very Important)

Auto-generate a unique Ticket Number like:

Format: ROYAL-YYYYMMDD-0001 (daily counter resets)
Example: ROYAL-20251223-0007

Ticket No must never duplicate.

Show Ticket No on Dashboard and on print.

4) Collection / Payment Tracking

Each ticket must have:

Collection Status: Unpaid / Paid

If Paid, show:

Received By (dropdown from saved “Receiver Names” list)

Payment Mode (Cash / UPI / Card / Other)

Paid Amount (default = Amount Rs.)

Paid Date/Time (auto)

If Unpaid, these fields hidden/empty.

Show clear badge on dashboard:

✅ Paid (green)

❌ Unpaid (red)

5) Daily Dashboard (Records)

Dashboard should open with Today’s date and show:

Summary Cards

Tickets Today

Total Collection Today (sum of paid amount)

Total Unpaid Today

Total Passengers Today

Ticket Table (Today)

Columns:

Ticket No

Booking Time

Journey Date

Tours To (From–To / Destination)

Passenger Name

Phone

Seat No

No. of Tourist

Amount

Paid/Unpaid

Received By (if paid)

Actions: View / Print / Mark Paid / Edit / Delete

Filters

Date picker (default today)

Paid/Unpaid filter

Search by Ticket No / Passenger Mobile / Passenger Name

Export

Export selected date report to Excel + PDF

6) Receiver Names (Dropdown Management)

Make a simple Settings page:

“Receiver Names” list (add/edit/delete)
Examples: Owner, Counter1, Counter2, Manager, etc.
This list feeds the Received By dropdown.

7) Data Storage

Use a database with these tables:

Tickets

id (uuid)

ticketNo (unique)

bookingDateTime

journeyDate

passengerName

passengerPhone

address

toursTo

noOfTourist

seatNo

repTime

depTime

amount

pnrNo

busNo

branch

notes

collectionStatus (Paid/Unpaid)

Payments

id

ticketId (relation)

receivedByName

paymentMode

paidAmount

paidAt

ReceiverNames

id

name

active

8) Screens Needed

Dashboard

New Ticket

Ticket Details (with Print + Mark Paid)

Settings (Company header + Receiver Names)

Reports / Export

Build the full working app with clean UI and fast entry.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://safari3.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/99197f26-0e79-44e5-9ffd-a68d6665f5a9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
