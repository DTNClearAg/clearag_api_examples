"""
Creates new fields from a list of locations
"""

import argparse
import csv
import json
import urllib

_URL_BASE = 'https://ag.us.clearapis.com/v1.0/accounts'
_DUMP_FILE_NAME = 'fields_info'

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
    parser_remove.set_defaults(func=_remove_fields_from_file)

    return parser.parse_args()
# End def

def _create_fields_from_file(args):
    create_fields_from_file(args.account_id, args.user_id, args.locations_file_name)
# End def

def create_fields_from_file(account_id, user_id, locations_file_name):
    locations = _get_locations(locations_file_name)

    fields = _create_fields(account_id, user_id, locations)

    _dump_field_ids(_DUMP_FILE_NAME, fields, account_id, user_id)
# End def

def _get_locations(locations_file_name):
    locations = list()

    with open(locations_file_name, 'r') as locations_input:
        csv_reader = csv.reader(locations_input)
        csv_reader.next()

        for row in csv_reader:
            locations.append({
                'name': '%s_%s' % (row[0], row[1]),
                'lat': row[2],
                'lon': row[3]
            })
        # End for
    # End with

    return locations
# End def

def _create_fields(account_id, user_id, locations_input):
    locations_output = list()

    for location in locations_input:
        url = '%s/field/create?account_id=%s&user_id=%s&acres=1&latitude=%s&longitude=%s&name=%s' % (_URL_BASE, account_id, user_id, location['lat'], location['lon'], location['name'])

        response = urllib.urlopen(url)

        if response.getcode() == 400:
            print ('400 Error\n'
                   '  %s' % url)

        locations_output.append({
            'name': location['name'],
            'field_id': response.read(),
            'lat': location['lat'],
            'lon': location['lon']
        })
    # End for

    return locations_output
# End def

def _dump_field_ids(dump_file_name, fields, account_id, user_id):
    with open('%s' % dump_file_name, 'w') as accounts_dump:
        json.dump({'account_id': account_id, 'user_id': user_id, 'fields': fields},
                  accounts_dump,
                  separators=(', ', ': '),
                  sort_keys=True,
                  indent=4)

        print 'Field IDs dumped into ./%s.json' % dump_file_name
    # End with
# End def

def _remove_fields_from_file(args):
    remove_fields_from_file(args.account_id, args.user_id)
# End def

def remove_fields_from_file(account_id, user_id):
    with open('fields_info.json', 'r') as input_file:
        fields_info = json.load(input_file)

        for field in fields_info['fields']:
            url = '%s/field/delete/%s?account_id=%s&user_id=%s' % (_URL_BASE,
                                                                   field['field_id'],
                                                                   account_id,
                                                                   user_id)
            response = urllib.urlopen(url)

            if response.getcode() == 400:
                print ('400 Error\n'
                       '  %s' % url)
            # End if
        # End for
    # End with
# End def

if __name__ == '__main__':
    main()
    exit(0)
# End if
