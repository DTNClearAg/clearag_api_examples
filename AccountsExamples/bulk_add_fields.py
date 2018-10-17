"""
Creates new fields from a list of locations
"""

import argparse
import csv
import json
import urllib

APP_ID = '98fdd508'
APP_KEY = '1b89053c245aeceb7df6cac437e2a8ca'

_URL_BASE = 'https://ag.us.clearapis.com/v1.0/accounts'

def main():
    """Main function"""
    args = _get_args()
    args.func(args)
# End def

def _get_args():

    # Top level parser
    parser = argparse.ArgumentParser(description='This script can either create fields from a list of locations or remove fields')
    subparsers = parser.add_subparsers(title='Subcommands')


    # Add parser
    parser_add = subparsers.add_parser('add',
                                       help='Create fields from a list of locations')
    parser_add.add_argument('account_id',
                            help='Account ID to use')
    parser_add.add_argument('user_id',
                            help='The user ID to use')
    parser_add.add_argument('locations_file_name',
                            help='The name of the location list file')
    parser_add.set_defaults(func=_create_fields_from_file)

    # Remove parser
    parser_remove = subparsers.add_parser('remove',
                                          help='Removes all fields in the "fields_info.json" file.')
    parser_remove.add_argument('account_id',
                               help='Account ID to use')
    parser_remove.add_argument('user_id',
                               help='The user ID to use')
    parser_remove.add_argument('locations_file_name',
                            help='The name of the location list file')
    parser_remove.set_defaults(func=_remove_fields_from_file)

    return parser.parse_args()
# End def

def _create_fields_from_file(args):
    create_fields_from_file(args.account_id, args.user_id, args.locations_file_name)
# End def

def create_fields_from_file(account_id, user_id, locations_file_name):
    locations = _get_locations(locations_file_name)

    fields = _create_fields(account_id, user_id, locations)

    _dump_field_ids(locations_file_name, fields, account_id, user_id)
# End def

def _get_locations(locations_file_name):
    locations = list()

    with open(locations_file_name, 'r') as locations_input:
        csv_reader = csv.reader(locations_input)
        csv_reader.next()

        for row in csv_reader:
            locations.append({
                'name': row[0],
                'lat': row[1],
                'lon': row[2],
                'acres': row[3]
            })
        # End for

        locations_input.close()
    # End with

    return locations
# End def

def _create_fields(account_id, user_id, locations_input):
    locations_output = list()

    for location in locations_input:
        url = '%s/field/create?app_id=%s&app_key=%s&account_id=%s&user_id=%s&acres=%s&latitude=%s&longitude=%s&name=%s' % (_URL_BASE, APP_ID, APP_KEY, account_id, user_id, location['acres'], location['lat'], location['lon'], location['name'])

        print url
        response = urllib.urlopen(url)

        if response.getcode() != 200:
            print ('%s Error:\n' % response.getcode(),
                   '  %s' % url)

        locations_output.append({
            'name': location['name'],
            'field_id': response.read(),
            'lat': location['lat'],
            'lon': location['lon'],
            'acres': location['acres']
        })
    # End for

    return locations_output
# End def

def _dump_field_ids(dump_file_name, fields, account_id, user_id):
    with open(dump_file_name, 'w') as accounts_dump:
        csv_writer = csv.writer(accounts_dump)
        header = ['field_name', 'latitude', 'longitude', 'acres', 'field_id']
        csv_writer.writerow(header)

        for field in fields:
            row = [field['name'], field['lat'], field['lon'], field['acres'], field['field_id']]
            csv_writer.writerow(row)

        print 'Field IDs exported into ./%s' % dump_file_name
    # End with
# End def

def _remove_fields_from_file(args):
    remove_fields_from_file(args.account_id, args.user_id, args.locations_file_name)
# End def

def remove_fields_from_file(account_id, user_id, locations_file_name):
    locations = {}
    with open(locations_file_name, 'r') as input_file:
        csv_reader = csv.reader(input_file)
        csv_reader.next()

        for row in csv_reader:
            locations[row[0]] = {
                'lat': row[1],
                'lon': row[2],
                'acres': row[3],
                'field_id': row[4],
                'deleted': False
            }

        for field in sorted(locations.keys()):
            url = '%s/field/delete/%s?app_id=%s&app_key=%s&account_id=%s&user_id=%s' % (_URL_BASE, locations[field]['field_id'], APP_ID, APP_KEY, account_id, user_id)
            response = urllib.urlopen(url)

            if response.getcode() != 200:
                print ('%s Error:\n' % response.getcode(),
                       '  %s' % url)
            else:
                locations[field]['deleted'] = True
                print ('Removed {} | {}'.format(field, locations[field]['field_id']))
            # End if
        # End for
        input_file.close()
    # End with

    with open(locations_file_name, 'w') as fields_dump:
        csv_writer = csv.writer(fields_dump)
        header = ['field_name', 'latitude', 'longitude', 'acres']
        csv_writer.writerow(header)

        for field in locations:
            if locations[field]['deleted']:
                row = [field, locations[field]['lat'], locations[field]['lon'], locations[field]['acres']]
            else:
                row = [field, locations[field]['lat'], locations[field]['lon'], locations[field]['acres'], locations[field]['field_id'], 'Failed to Delete']
            csv_writer.writerow(row)
        # End for
    # End with
# End def

if __name__ == '__main__':
    main()
    exit(0)
# End if
