CREATE OR REPLACE FUNCTION "_backfill_image_asset_public_id"(image_url text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  image_path text;
  asset_path text;
  upload_path_index int;
  segments text[];
  segment text;
  first_asset_index int := 1;
  version_index int;
  public_id_path text;
BEGIN
  image_path := image_url;

  IF image_url ~ '^[a-z][a-z0-9+.-]*://' THEN
    image_path := regexp_replace(image_url, '^[a-z][a-z0-9+.-]*://[^/]*', '');
    image_path := regexp_replace(image_path, '[?#].*$', '');
  END IF;

  upload_path_index := strpos(image_path, '/image/upload/');

  IF upload_path_index > 0 THEN
    asset_path := substring(image_path from upload_path_index + length('/image/upload/'));
  ELSE
    asset_path := regexp_replace(image_path, '^.*/', '');
  END IF;

  SELECT array_agg(part)
  INTO segments
  FROM unnest(string_to_array(asset_path, '/')) AS part
  WHERE part <> '';

  IF segments IS NULL OR array_length(segments, 1) IS NULL THEN
    RETURN '';
  END IF;

  FOR i IN 1..array_length(segments, 1) LOOP
    IF segments[i] ~ '^v[0-9]+$' THEN
      version_index := i;
    END IF;
  END LOOP;

  IF version_index IS NOT NULL THEN
    first_asset_index := version_index + 1;
  ELSE
    FOR i IN 1..array_length(segments, 1) LOOP
      segment := segments[i];

      IF NOT (
        SELECT bool_and(token ~ '^(a|ar|b|bo|c|co|d|dl|dn|dpr|e|f|fl|fn|g|h|if|l|o|pg|q|r|t|u|w|x|y|z)_.+$')
        FROM unnest(string_to_array(segment, ',')) AS token
      ) THEN
        first_asset_index := i;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  SELECT string_agg(segments[i], '/')
  INTO public_id_path
  FROM generate_subscripts(segments, 1) AS i
  WHERE i >= first_asset_index;

  public_id_path := regexp_replace(coalesce(public_id_path, ''), '\.[^/.]+$', '');

  RETURN public_id_path;
END;
$$;

DO $$
DECLARE
  profile_pic_type text;
  product_images_type text;
BEGIN
  SELECT udt_name
  INTO profile_pic_type
  FROM information_schema.columns
  WHERE table_name = 'UserSettings'
    AND table_schema = current_schema()
    AND column_name = 'profilePic';

  SELECT udt_name
  INTO product_images_type
  FROM information_schema.columns
  WHERE table_name = 'Product'
    AND table_schema = current_schema()
    AND column_name = 'images';

  IF profile_pic_type = 'text' THEN
    ALTER TABLE "UserSettings" ADD COLUMN "profilePic_json" jsonb;

    UPDATE "UserSettings"
    SET "profilePic_json" =
      CASE
        WHEN "profilePic" IS NULL THEN NULL
        ELSE jsonb_build_object(
          'url', "profilePic",
          'publicId', "_backfill_image_asset_public_id"("profilePic")
        )
      END;

    ALTER TABLE "UserSettings" DROP COLUMN "profilePic";
    ALTER TABLE "UserSettings" RENAME COLUMN "profilePic_json" TO "profilePic";
  ELSIF profile_pic_type IN ('json', 'jsonb') THEN
    ALTER TABLE "UserSettings"
    ALTER COLUMN "profilePic" TYPE jsonb
    USING "profilePic"::jsonb;

    UPDATE "UserSettings"
    SET "profilePic" = jsonb_build_object(
      'url', "profilePic" #>> '{}',
      'publicId', "_backfill_image_asset_public_id"("profilePic" #>> '{}')
    )
    WHERE "profilePic" IS NOT NULL
      AND jsonb_typeof("profilePic") = 'string';
  END IF;

  IF product_images_type = '_text' THEN
    ALTER TABLE "Product" ADD COLUMN "images_json" jsonb;

    UPDATE "Product"
    SET "images_json" = coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'url', image_url,
            'publicId', "_backfill_image_asset_public_id"(image_url)
          )
          ORDER BY image_index
        )
        FROM unnest("images") WITH ORDINALITY AS image(image_url, image_index)
      ),
      '[]'::jsonb
    );

    ALTER TABLE "Product" DROP COLUMN "images";
    ALTER TABLE "Product" RENAME COLUMN "images_json" TO "images";
    ALTER TABLE "Product" ALTER COLUMN "images" SET NOT NULL;
  ELSIF product_images_type IN ('json', 'jsonb') THEN
    ALTER TABLE "Product"
    ALTER COLUMN "images" TYPE jsonb
    USING "images"::jsonb;

    UPDATE "Product"
    SET "images" = '[]'::jsonb
    WHERE "images" IS NULL
      OR jsonb_typeof("images") = 'null';

    UPDATE "Product"
    SET "images" = coalesce(
      (
        SELECT jsonb_agg(
          CASE
            WHEN jsonb_typeof(image.value) = 'string' THEN
              jsonb_build_object(
                'url', image.value #>> '{}',
                'publicId', "_backfill_image_asset_public_id"(image.value #>> '{}')
              )
            ELSE image.value
          END
          ORDER BY image.image_index
        )
        FROM jsonb_array_elements("images") WITH ORDINALITY AS image(value, image_index)
      ),
      '[]'::jsonb
    )
    WHERE jsonb_typeof("images") = 'array'
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements("images") AS image
        WHERE jsonb_typeof(image.value) = 'string'
      );

    ALTER TABLE "Product" ALTER COLUMN "images" SET NOT NULL;
  END IF;
END;
$$;

DROP FUNCTION "_backfill_image_asset_public_id"(text);
