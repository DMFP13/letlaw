-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL DEFAULT 'house',
    "bedrooms" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tenancy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "rentAmount" REAL NOT NULL,
    "rentFrequency" TEXT NOT NULL DEFAULT 'monthly',
    "rentDueDay" INTEGER NOT NULL DEFAULT 1,
    "depositAmount" REAL,
    "depositScheme" TEXT,
    "depositRef" TEXT,
    "depositProtectedAt" DATETIME,
    "prescribedInfoIssued" BOOLEAN NOT NULL DEFAULT false,
    "prescribedInfoDate" DATETIME,
    "infoSheetIssued" BOOLEAN NOT NULL DEFAULT false,
    "infoSheetDate" DATETIME,
    "writtenTermsIssued" BOOLEAN NOT NULL DEFAULT false,
    "writtenTermsDate" DATETIME,
    "rightToRentChecked" BOOLEAN NOT NULL DEFAULT false,
    "rightToRentDate" DATETIME,
    "lastRentIncreaseDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tenancy_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenancyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tenant_tenancyId_fkey" FOREIGN KEY ("tenancyId") REFERENCES "Tenancy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "issueDate" DATETIME,
    "expiryDate" DATETIME,
    "certificateNo" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ComplianceRecord_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Repair" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "reportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" DATETIME,
    "resolvedAt" DATETIME,
    "contractorName" TEXT,
    "contractorContact" TEXT,
    "cost" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Repair_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "repairId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT,
    "notes" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "Repair" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RentReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenancyId" TEXT NOT NULL,
    "proposedAmount" REAL NOT NULL,
    "currentAmount" REAL NOT NULL,
    "noticeDate" DATETIME NOT NULL,
    "effectiveDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "noticeRef" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RentReview_tenancyId_fkey" FOREIGN KEY ("tenancyId") REFERENCES "Tenancy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
