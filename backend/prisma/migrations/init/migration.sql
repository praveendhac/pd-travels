-- CreateTable "User"
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable "Trip"
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable "TripCollaborator"
CREATE TABLE "TripCollaborator" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "TripCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable "ItineraryItem"
CREATE TABLE "ItineraryItem" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "day_date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "notes" TEXT,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "ItineraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable "Expense"
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "itinerary_item_id" TEXT,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "note" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable "Place"
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "raw_json" TEXT NOT NULL,
    "cached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Trip_owner_id_idx" ON "Trip"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "TripCollaborator_trip_id_user_id_key" ON "TripCollaborator"("trip_id", "user_id");

-- CreateIndex
CREATE INDEX "TripCollaborator_trip_id_idx" ON "TripCollaborator"("trip_id");

-- CreateIndex
CREATE INDEX "TripCollaborator_user_id_idx" ON "TripCollaborator"("user_id");

-- CreateIndex
CREATE INDEX "ItineraryItem_trip_id_idx" ON "ItineraryItem"("trip_id");

-- CreateIndex
CREATE INDEX "Expense_trip_id_idx" ON "Expense"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "Place_external_id_key" ON "Place"("external_id");

-- CreateIndex
CREATE INDEX "Place_name_idx" ON "Place"("name");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripCollaborator" ADD CONSTRAINT "TripCollaborator_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripCollaborator" ADD CONSTRAINT "TripCollaborator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryItem" ADD CONSTRAINT "ItineraryItem_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
