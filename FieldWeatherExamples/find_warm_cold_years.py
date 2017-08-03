#!/usr/bin/env python
#=======================================================================
'''
Test of some historical data processing
'''
#=======================================================================

# Built-in Python modules
import os
from time import tzset
from datetime import datetime
from optparse import OptionParser
from string import Template
import urllib
import json


# User configurable items. Need ClearAg API app_key and app_id
app_id = None
app_key = None

# User preferred units:  si-std or us-std (See http://docs.clearag.com/documentation/Field_Weather_API/latest
units_def = 'si-std'
#units_def = 'us-std'

# Other default items - should not need to be changed
url_base = 'https://ag.clearapis.com'

# Things just go smoother when working with times and weather data in UTC
os.environ['TZ'] = 'UTC'
tzset()

def get_daily_history(lat,lon,start_date,end_date,units=units_def):

    # This routine calls the daily historical temperature API and returns a dictionary
    # of data for the location.  It allows calling longer ranges of data than
    # the API allows by doing multiple calls if needed

    global units_def
    global url_base
    global app_id
    global app_key

    if app_key is None or app_id is None:
        print "Need to set app_id and app_key at top of this script!"
        exit(-1)

    # Daily historical allows up to 366 days to be queried
    max_range_sec = 365 * 86400

    data = None
    url_t = "%s/v1.2/historical/daily?app_id=%s&app_key=%s&location=$lat,$lon&start=$time_beg&end=$time_end&unitcode=$units" % (url_base, app_id, app_key)


    # Get start/stop epoch times from input date strings of YYYY-MM-DD format
    # For daily values, dates refer to midnight-to-midnight local time.  But, you have to
    # use epoch unix times to make the request.  These epoch times are
    # formed by converting YYYY-mm-ddT00:00UTC, where YYYY-mm-dd is the local date
    # you want, into the epoch time.

    d_beg = datetime(int(start_date[0:4]),int(start_date[5:7]),int(start_date[8:10]),0,0,0)
    d_end = datetime(int(end_date[0:4]),int(end_date[5:7]),int(end_date[8:10]),0,0,0)

    # compute epochs
    time_beg = int(d_beg.strftime("%s"))
    time_end = int(d_end.strftime("%s"))

    time1 = time_beg
    # APIs end time is non-inclusive.  Add 1 second to overcome that
    time2 = min([time_end,time1+max_range_sec]) + 1

    # Loop to accomodate more than one query if needed
    while time1 < time_end:
        url = Template(url_t)
        url2get = url.substitute(lat=lat,lon=lon,time_beg=time1,time_end=time2,units=units)
        print url2get
        response = urllib.urlopen(url2get)

        if response is not None:
            if data == None:

                # We are restricting to one location per call of this routine,
                # so let's strip off the outer element of the JSON ("lat,lon" key)
                # and let the calling application be responsible for knowing that.

                data = (json.loads(response.read())).values()[0]
            else:
                data.update( (json.loads(response.read())).values()[0])

        # Time2 had that extra second, so clip it off and re-add for next time
        time1 = time2 + 86400 - 1
        time2 = min([time1+max_range_sec,time_end]) + 1

    return data


### Main program

if __name__ == '__main__':

    usage = '''Usage: %prog [options] lat lon

This Python script finds the warmest and coldest years covering Sep-Dec of each year
for a given location. Lat/lon are specified as decimal values, postive north and east

Examples:
   %prog 35.375 -97.340
'''

    start_year = 2005
    end_year = 2015
    start_month = 1
    end_month = 12

    p = OptionParser(usage)
    p.add_option('--start_year', default=start_year, help='Oldest year to check [%default]')
    p.add_option('--end_year', default=end_year, help='Latest year to check [%default]')
    p.add_option('--start_month', default=start_month, help='First month [1-12] to check [%default]')
    p.add_option('--end_month', default=end_month, help='Last month [1-12] to check [%default]')

    opts, args = p.parse_args()
    if len(args) < 2:
        print "You must specify lat lon as two mandatory arguments!"
        exit(-1)

    lat = float(args[0])
    lon = float(args[1])
    if lat < -90 or lat > 90 or lon < -180 or lon > 180:
        print "Invalid lat or lon.",lat,lon
        exit(-1)

    start_year = int(opts.start_year)
    end_year = int(opts.end_year)
    start_month = int(opts.start_month)
    end_month = int(opts.end_month)

    print "Will check years %d-%d, between months %d and %d, for (%f,%f)" %  \
          (start_year, end_year, start_month, end_month, lat, lon)

    years = range(start_year,end_year,1)
    year_coldest = None
    year_warmest = None
    tavg_warmest = None
    tavg_coldest = None

    days_mon = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    m_end_ind = end_month - 1
    for y in years:

        # Get last day of end month
        if (y % 4 == 0):
            days_mon[1] = 29
        else:
            days_mon[0] = 28

        end_day = days_mon[m_end_ind]

        # Get the daily history
        date_beg = '%4.4d-%2.2d-%2.2d' % (y, start_month, 1)
        date_end = '%4.4d-%2.2d-%2.2d' % (y, end_month, end_day)
        print "Getting history for %s to %s" % (date_beg, date_end)
        data = get_daily_history(lat, lon, date_beg, date_end)

        t_avg_sum = 0.
        cnt = 0.
        for k in data.keys():
            if data[k]['air_temp_max']['value'] != 'n/a' and data[k]['air_temp_min']['value'] != 'n/a':
                t_avg_sum += 0.5 * (float(data[k]['air_temp_max']['value']) + float(data[k]['air_temp_min']['value']))
                cnt += 1.0

        t_avg_all = t_avg_sum / cnt

        if year_warmest is None:
             year_warmest = y
             tavg_warmest = t_avg_all
             year_coldest = y
             tavg_coldest = t_avg_all
        else:
            if t_avg_all > tavg_warmest:
                year_warmest = y
                tavg_warmest = t_avg_all
            if t_avg_all < tavg_coldest:
                year_coldest = y
                tavg_coldest = t_avg_all

    print "Coldest year was %d with an average temp of %.1f" % (year_coldest, tavg_coldest)
    print "Warmest year was %d with an average temp of %.1f" % (year_warmest, tavg_warmest)

    exit(0)
