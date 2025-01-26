<template>
  <q-page padding>
    <!-- Flex container for responsive layout -->
    <div :class="layoutClass">
      <!-- Form and lead addition -->
      <q-card class="form-card q-my-md q-pa-md">
        <q-card-section>
          <div class="text-h6">Add New Lead</div>
          <p>Fill in the details below to create a new lead.</p>
        </q-card-section>

        <q-form @submit="onSubmit" @reset="resetForm">
          <q-card-section>
            <q-input
              filled
              v-model="lead.name"
              label="Name"
              :rules="[(val) => !!val || 'Name is required']"
              prepend="person"
            />
            <q-input
              filled
              v-model="lead.email"
              label="Email"
              :rules="[
                (val) => !!val || 'Email is required',
                (val) => /.+@.+\..+/.test(val) || 'Email must be valid',
              ]"
              prepend="email"
            />
            <q-input
              filled
              v-model="lead.phone"
              label="Phone"
              mask="(###) ###-####"
              :rules="[(val) => !!val || 'Phone is required']"
              prepend="phone"
            />
            <q-select
              filled
              v-model="lead.companySize"
              label="Company Size"
              :options="companySizes"
              map-options
              option-label="label"
              option-value="value"
              :rules="[(val) => !!val || 'Company size is required']"
              prepend="business"
            />
            <q-checkbox
              v-model="lead.interested"
              label="Interested"
              color="primary"
            />
            <q-btn
              label="Get Current Location"
              color="primary"
              icon="place"
              @click="getLocation"
              class="full-width q-mt-md"
            />
            <q-input
              filled
              v-model="lead.location"
              label="Location (GPS)"
              readonly
              prepend="my_location"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-mb-md">
            <q-btn type="reset" label="Reset" color="grey" flat />
            <q-btn type="submit" label="Add Lead" color="primary" />
          </q-card-actions>
        </q-form>
      </q-card>

      <!-- Map container -->
      <div class="map-container">
        <iframe
          :src="mapUrl"
          width="100%"
          height="300"
          style="border: 0"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  </q-page>
</template>

<script>
import { computed, onMounted } from "vue";
import { useLeadStore } from "../stores/leadStore";

export default {
  data() {
    return {
      lead: {
        name: "",
        email: "",
        phone: "",
        location: "",
        companySize: null,
        interested: false,
      },
      mapUrl: "",
      companySizes: [
        { label: "XS", value: "XS" },
        { label: "S", value: "S" },
        { label: "M", value: "M" },
        { label: "L", value: "L" },
        { label: "XL", value: "XL" },
      ],
    };
  },
  setup() {
    const leadStore = useLeadStore();

    onMounted(() => {
      leadStore.loadLeadsFromLocalStorage();
    });

    return {
      leads: computed(() => leadStore.leads),
      addLead: leadStore.addLead,
    };
  },
  computed: {
    // Determine layout class based on screen size
    layoutClass() {
      return window.innerWidth > 600 ? "layout-desktop" : "layout-mobile";
    },
  },
  methods: {
    onSubmit() {
      this.addLead({ ...this.lead });
      this.resetForm();
    },
    resetForm() {
      this.lead = {
        name: "",
        email: "",
        phone: "",
        location: "",
        companySize: null,
        interested: false,
      };
      this.mapUrl = "";
    },
    getLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords: { latitude, longitude } }) => {
            this.lead.location = `${latitude}, ${longitude}`;
            this.updateMapUrl(latitude, longitude);
          },
          (error) => {
            console.error("Error fetching location", error);
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    },
    updateMapUrl(latitude, longitude) {
      this.mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
        longitude - 0.005
      },${latitude - 0.005},${longitude + 0.005},${
        latitude + 0.005
      }&layer=mapnik&marker=${latitude},${longitude}`;
    },
  },
  mounted() {
    window.addEventListener("resize", this.$forceUpdate);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.$forceUpdate);
  },
};
</script>

<style scoped>
.layout-desktop {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.layout-mobile {
  display: block;
}

.form-card {
  flex: 1;
}

.map-container {
  flex: 1;
  margin-top: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
}

.full-width {
  width: 100%;
}
</style>
