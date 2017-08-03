# Add Bulk Fields

This Python script takes a CSV file of locations and creates new fields within the [ClearAG Accounts API](https://docs.clearag.com/documentation/Accounts_API/latest). An output file "fields_info.json" is created containing the field_ids of the new fields. This script can also read that file to remove fields.

The input CSV file must have the headers:
```
trial_name,latitude,longitude
```