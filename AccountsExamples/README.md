# Add Bulk Fields

This Python script takes a CSV file of locations and creates new fields within the [ClearAG Accounts API](https://docs.clearag.com/documentation/Accounts_API/latest). The new Field UUIDs will be added to the input file.  This script can also read that file to remove fields.

Required input arguments are based on required parameters from the [Create Field API](https://docs.clearag.com/documentation/Accounts_API/latest#_create_field_v1_0).  The input CSV file must be in the following order:
```
field_name,latitude,longitude,acres
```

Example command line call:
'''
python bulk_add_fields.py add <account_id_placeholder> <user_id_placeholder> <input_csv_placeholder>
python bulk_add_fields.py add 0ab7ef73-4321-47e6-995f-dc0bae1feaed dba28ce2-bbd3-1234-9b33-c708771a7b08 test_field_create.csv
'''


Example Input CSV:
'''
field_name,latitude,longitude,acres
field1,43,-90,10
field2,44,-91,10
field3,45,-92,10
'''

Example Output:
'''
field_name,latitude,longitude,acres,field_id
field1,43,-90,10,7d4a9997-9352-4371-9d20-97a5e4856dbc
field2,44,-91,10,1bad6f19-50c5-43bb-85dc-e8c14f70ae5b
field3,45,-92,10,47e03966-6035-4d55-8173-d49816fc9553
'''
