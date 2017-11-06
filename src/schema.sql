BEGIN;

CREATE TABLE medias (
  id              SERIAL PRIMARY KEY,
  activityId      VARCHAR(50) NOT NULL,
  mediaType       VARCHAR(40) NOT NULL,
  contentObjectId OID         NOT NULL,
  dateAdded       DATE NOT NULL DEFAULT NOW()
);

CREATE TABLE addresses (
  name VARCHAR(20) PRIMARY KEY,
  address JSON NOT NULL
);

CREATE OR REPLACE FUNCTION delete_old_media(IN mediasToLeft INT)
  RETURNS VOID AS $$
    DECLARE
      row RECORD;
    BEGIN
      FOR row IN SELECT
                     id,
                     contentObjectId
                   FROM medias
                   ORDER BY dateadded DESC
                   OFFSET mediasToLeft
      LOOP
        DELETE FROM medias WHERE id = row.id;
        PERFORM lo_unlink(row.contentObjectId);
      END LOOP;
    END;

  $$ LANGUAGE plpgsql;

COMMIT;
