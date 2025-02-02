<template>
  <q-page padding>
    <div class="container">
      <div class="table-section">
        <q-btn
          label="Add New Customer"
          color="primary"
          icon="add"
          class="q-mb-md"
          to="/new"
        />

        <q-table
          title="Customer List"
          :rows="customers"
          :columns="columns"
          row-key="id"
          :pagination="pagination"
        >
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="id" :props="props">{{ props.row.id }}</q-td>
              <q-td key="name" :props="props">{{ props.row.name }}</q-td>
              <q-td key="email" :props="props">{{ props.row.email }}</q-td>
              <q-td key="activity" :props="props">{{
                props.row.activity
              }}</q-td>
              <q-td key="phones" :props="props">
                <ul>
                  <li v-for="(phone, index) in props.row.phones" :key="index">
                    {{ phone.label }}: {{ phone.number }}
                  </li>
                </ul>
              </q-td>
              <q-td key="actions" :props="props">
                <q-btn
                  label="Edit"
                  color="primary"
                  size="sm"
                  :to="`/customers/${props.row.id}`"
                />
                <q-btn
                  label="Delete"
                  color="negative"
                  size="sm"
                  @click="deleteCustomer(props.row.id)"
                />
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>

      <div class="map-section" ref="map" id="map"></div>
    </div>
  </q-page>
</template>

<script>
import { ref, computed, onMounted, nextTick } from "vue";
import { useLeadStore } from "../stores/leadStore";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import { Feature } from "ol";
import Point from "ol/geom/Point";
import { Icon, Style } from "ol/style";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";

export default {
  setup() {
    const leadStore = useLeadStore();

    onMounted(() => {
      leadStore.loadLeadsFromLocalStorage();
    });

    const customers = computed(() => leadStore.leads);
    const mapElement = ref(null);

    const columns = [
      { name: "id", label: "ID", align: "left", field: "id", sortable: true },
      {
        name: "name",
        label: "Name",
        align: "left",
        field: "name",
        sortable: true,
      },
      {
        name: "email",
        label: "Email",
        align: "left",
        field: "email",
        sortable: true,
      },
      {
        name: "activity",
        label: "Domain of Activity",
        align: "left",
        field: "activity",
        sortable: true,
      },
      {
        name: "phones",
        label: "Phone Numbers",
        align: "left",
        field: "phones",
      },
      { name: "actions", label: "Actions", align: "right", field: "actions" },
    ];

    const pagination = ref({
      sortBy: "name",
      descending: false,
      page: 1,
      rowsPerPage: 10,
    });

    const vectorSource = new VectorSource();

    let map;

    // Once the DOM is ready, set the map target
    nextTick(() => {
      map = new Map({
        target: "map",
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          new VectorLayer({
            source: vectorSource,
          }),
        ],
        view: new View({
          center: fromLonLat([9.0, 35.0]), // Center on Tunisia
          zoom: 7.5, // Set an appropriate zoom level to see Tunisia
        }),
      });
      displayMarkers();
    });

    const deleteCustomer = (id) => {
      leadStore.deleteLead(id);
      displayMarkers();
    };

    const displayMarkers = () => {
      vectorSource.clear(); // Clear existing markers
      customers.value.forEach((customer) => {
        if (customer.location) {
          const [lat, lon] = customer.location.split(", ").map(Number);
          const marker = new Feature({
            geometry: new Point(fromLonLat([lon, lat])),
          });

          const iconStyle = new Style({
            image: new Icon({
              anchor: [0.5, 1],
              src: " ./marker.png",

              scale: 0.3,
            }),
          });

          marker.setStyle(iconStyle);
          vectorSource.addFeature(marker);
        }
      });
    };

    return {
      customers,
      columns,
      pagination,
      deleteCustomer,
      mapElement,
    };
  },
};
</script>

<style scoped>
.container {
  display: flex;
  height: 100vh;
}

.table-section {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.map-section {
  flex: 1;
  height: 100%;
  padding: 16px;
  overflow: hidden;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin-bottom: 4px;
}

#map {
  width: 100%;
  height: 100%;
}
</style>
